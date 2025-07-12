import pandas as pd
import re
from datetime import datetime
from django.db import transaction
from django.core.exceptions import ValidationError
from core.models import Student
from groups.models import GroupInfo


class StudentImportService:
    """学生信息导入服务"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.success_count = 0
        self.skip_count = 0
    
    def validate_id_card(self, id_card):
        """验证身份证号格式"""
        if not id_card or len(str(id_card)) != 18:
            return False
        
        id_card = str(id_card)
        if not re.match(r'^\d{17}[\dX]$', id_card):
            return False
        
        return True
    
    def import_students_from_excel(self, file_path, batch_name=None):
        """从Excel文件导入学生信息"""
        try:
            # 读取Excel文件
            df = pd.read_excel(file_path)
            
            # 生成批次名称
            if not batch_name:
                batch_name = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            self.errors = []
            self.warnings = []
            self.success_count = 0
            self.skip_count = 0
            
            # 验证必要的列是否存在
            required_columns = ['姓名', '身份证号']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                raise ValueError(f"缺少必要的列: {', '.join(missing_columns)}")
            
            # 处理每一行数据
            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        self._process_student_row(row, index + 2, batch_name)  # +2因为Excel从第2行开始
                    except Exception as e:
                        self.errors.append(f"第{index + 2}行: {str(e)}")
                        continue
            
            return {
                'success': True,
                'batch_name': batch_name,
                'success_count': self.success_count,
                'skip_count': self.skip_count,
                'errors': self.errors,
                'warnings': self.warnings
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'batch_name': batch_name,
                'success_count': self.success_count,
                'skip_count': self.skip_count,
                'errors': self.errors,
                'warnings': self.warnings
            }
    
    def _process_student_row(self, row, row_number, batch_name):
        """处理单行学生数据"""
        name = str(row['姓名']).strip()
        id_card = str(row['身份证号']).strip()
        
        # 验证必填字段
        if not name:
            raise ValueError("姓名不能为空")
        
        if not self.validate_id_card(id_card):
            raise ValueError("身份证号格式不正确")
        
        # 检查是否已存在
        if Student.objects.filter(id_card_number=id_card).exists():
            self.warnings.append(f"第{row_number}行: 身份证号 {id_card} 已存在，跳过")
            self.skip_count += 1
            return
        
        # 创建学生记录
        student_data = {
            'name': name,
            'id_card_number': id_card,
            'import_batch': batch_name,
            'import_row_number': row_number,
        }
        
        # 处理可选字段
        optional_fields = {
            '手机号码': 'phone_number',
            '邮箱': 'email',
        }
        
        for excel_col, model_field in optional_fields.items():
            if excel_col in row and pd.notna(row[excel_col]):
                student_data[model_field] = str(row[excel_col]).strip()
        
        # 创建学生对象
        student = Student(**student_data)
        student.full_clean()  # 验证数据
        student.save()
        
        self.success_count += 1


class GroupImportService:
    """分组信息导入服务"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.success_count = 0
        self.skip_count = 0
    
    def import_groups_from_excel(self, file_path):
        """从Excel文件导入分组信息"""
        try:
            df = pd.read_excel(file_path)
            
            self.errors = []
            self.warnings = []
            self.success_count = 0
            self.skip_count = 0
            
            # 验证必要的列
            required_columns = ['通知书编号', '所属分组', '分组教师', '教师联系方式', '报到地点']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                raise ValueError(f"缺少必要的列: {', '.join(missing_columns)}")
            
            # 处理每一行数据
            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        self._process_group_row(row, index + 2)
                    except Exception as e:
                        self.errors.append(f"第{index + 2}行: {str(e)}")
                        continue
            
            return {
                'success': True,
                'success_count': self.success_count,
                'skip_count': self.skip_count,
                'errors': self.errors,
                'warnings': self.warnings
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'success_count': self.success_count,
                'skip_count': self.skip_count,
                'errors': self.errors,
                'warnings': self.warnings
            }
    
    def _process_group_row(self, row, row_number):
        """处理单行分组数据"""
        notification_number = str(row['通知书编号']).strip()
        group_name = str(row['所属分组']).strip()
        group_teacher = str(row['分组教师']).strip()
        teacher_phone = str(row['教师联系方式']).strip()
        report_location = str(row['报到地点']).strip()
        
        # 验证必填字段
        if not all([notification_number, group_name, group_teacher, teacher_phone, report_location]):
            raise ValueError("所有字段都不能为空")
        
        # 验证手机号格式
        if not re.match(r'^1[3-9]\d{9}$', teacher_phone):
            raise ValueError("教师联系方式格式不正确")
        
        # 检查通知书编号是否已存在
        if GroupInfo.objects.filter(notification_number=notification_number).exists():
            self.warnings.append(f"第{row_number}行: 通知书编号 {notification_number} 已存在，跳过")
            self.skip_count += 1
            return
        
        # 创建分组记录
        group = GroupInfo(
            notification_number=notification_number,
            group_name=group_name,
            group_teacher=group_teacher,
            teacher_phone=teacher_phone,
            report_location=report_location
        )
        
        group.full_clean()
        group.save()
        
        self.success_count += 1


class ExcelTemplateGenerator:
    """Excel模板生成器"""
    
    @staticmethod
    def generate_student_template(file_path):
        """生成学生信息导入模板"""
        data = {
            '姓名': ['张三', '李四', '王五'],
            '身份证号': ['110101200001011234', '110101200002022345', '110101200003033456'],
            '手机号码': ['13800138001', '13800138002', ''],
            '邮箱': ['zhangsan@example.com', '', ''],
        }
        
        df = pd.DataFrame(data)
        
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='学生信息')
            
            # 添加说明工作表
            instructions = pd.DataFrame({
                '字段名': ['姓名', '身份证号', '手机号码', '邮箱'],
                '是否必填': ['是', '是', '否', '否'],
                '说明': [
                    '学生真实姓名',
                    '18位身份证号码，用于自动计算性别和年龄',
                    '11位手机号码，可留空',
                    '电子邮箱地址，可留空'
                ]
            })
            instructions.to_excel(writer, index=False, sheet_name='导入说明')
    
    @staticmethod
    def generate_group_template(file_path):
        """生成分组信息导入模板"""
        data = {
            '通知书编号': ['A001', 'B001', 'C001'],
            '所属分组': ['计算机科学A组', '数学与应用数学B组', '物理学C组'],
            '分组教师': ['陈老师', '刘老师', '张老师'],
            '教师联系方式': ['13800138001', '13800138002', '13800138003'],
            '报到地点': ['教学楼A201', '教学楼B301', '教学楼C401'],
        }
        
        df = pd.DataFrame(data)
        
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='分组信息')
            
            # 添加说明工作表
            instructions = pd.DataFrame({
                '字段名': ['通知书编号', '所属分组', '分组教师', '教师联系方式', '报到地点'],
                '是否必填': ['是', '是', '是', '是', '是'],
                '说明': [
                    '唯一的通知书编号',
                    '分组名称',
                    '负责教师姓名',
                    '教师手机号码（11位）',
                    '学生报到地点'
                ]
            })
            instructions.to_excel(writer, index=False, sheet_name='导入说明')
