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
        
        # 处理通知书编号
        notification_number = ''
        if '通知书编号' in row and pd.notna(row['通知书编号']):
            notification_number = str(row['通知书编号']).strip()
        
        # 检查是否已存在（通过身份证号）
        if Student.objects.filter(id_card_number=id_card).exists():
            self.warnings.append(f"第{row_number}行: 身份证号 {id_card} 已存在，跳过")
            self.skip_count += 1
            return
        
        # 检查通知书编号是否重复
        if notification_number and Student.objects.filter(notification_number=notification_number).exists():
            self.warnings.append(f"第{row_number}行: 通知书编号 {notification_number} 已存在，跳过")
            self.skip_count += 1
            return
        
        # 创建学生记录
        student_data = {
            'name': name,
            'id_card_number': id_card,
            'import_batch': batch_name,
            'import_row_number': row_number,
        }
        
        # 添加通知书编号
        if notification_number:
            student_data['notification_number'] = notification_number
        
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
            required_columns = ['分组名称', '分组教师', '教师联系方式', '报到地点']
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
        group_name = str(row['分组名称']).strip()
        group_teacher = str(row['分组教师']).strip()
        teacher_phone = str(row['教师联系方式']).strip()
        report_location = str(row['报到地点']).strip()
        
        # 验证必填字段
        if not all([group_name, group_teacher, teacher_phone, report_location]):
            raise ValueError("所有字段都不能为空")
        
        # 验证手机号格式
        if not re.match(r'^1[3-9]\d{9}$', teacher_phone):
            raise ValueError("教师联系方式格式不正确")
        
        # 检查分组名称是否已存在
        if GroupInfo.objects.filter(group_name=group_name).exists():
            self.warnings.append(f"第{row_number}行: 分组名称 {group_name} 已存在，跳过")
            self.skip_count += 1
            return
        
        # 创建分组记录
        group = GroupInfo(
            group_name=group_name,
            group_teacher=group_teacher,
            teacher_phone=teacher_phone,
            report_location=report_location
        )
        
        group.full_clean()
        group.save()
        
        self.success_count += 1


class StudentGroupAssignmentImportService:
    """学生分组分配导入服务"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.success_count = 0
        self.skip_count = 0
    
    def import_assignments_from_excel(self, file_path):
        """从Excel文件导入学生分组分配信息"""
        try:
            from groups.models import StudentGroupAssignment
            
            # 读取Excel文件，确保数据类型正确
            df = pd.read_excel(file_path, dtype=str)  # 强制以字符串格式读取
            
            self.errors = []
            self.warnings = []
            self.success_count = 0
            self.skip_count = 0
            
            # 检查文件是否为空
            if df.empty:
                raise ValueError("Excel文件为空或没有数据")
            
            # 验证必要的列
            required_columns = ['通知书编号', '分组名称']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                available_columns = list(df.columns)
                raise ValueError(f"缺少必要的列: {', '.join(missing_columns)}。文件中可用的列: {', '.join(available_columns)}")
            
            # 数据预处理：移除完全空白的行
            df = df.dropna(how='all')
            
            # 记录数据统计
            total_rows = len(df)
            self.warnings.append(f"Excel文件共有 {total_rows} 行数据待处理")
            
            # 处理每一行数据
            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        # 跳过空行
                        if pd.isna(row['通知书编号']) and pd.isna(row['分组名称']):
                            continue
                            
                        self._process_assignment_row(row, index + 2)  # +2因为Excel从第2行开始，还要加上表头
                    except Exception as e:
                        self.errors.append(f"第{index + 2}行: {str(e)}")
                        continue
            
            # 生成详细的导入报告
            result = {
                'success': True,
                'success_count': self.success_count,
                'skip_count': self.skip_count,
                'errors': self.errors,
                'warnings': self.warnings,
                'total_processed': self.success_count + self.skip_count + len(self.errors),
                'message': f"处理完成: 成功 {self.success_count} 条，跳过 {self.skip_count} 条，失败 {len(self.errors)} 条"
            }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'success_count': self.success_count,
                'skip_count': self.skip_count,
                'errors': self.errors,
                'warnings': self.warnings,
                'total_processed': self.success_count + self.skip_count + len(self.errors),
                'message': f"导入失败: {str(e)}"
            }
    
    def _safe_str_conversion(self, value, field_name, row_number):
        """安全的字符串转换，处理Excel数字格式"""
        if pd.isna(value):
            return ""
        
        # 处理数字类型（Excel经常将编号转为数字）
        if isinstance(value, (int, float)):
            # 如果是浮点数但实际是整数，转为整数字符串
            if isinstance(value, float) and value.is_integer():
                return str(int(value))
            return str(value)
        
        # 字符串类型直接转换
        return str(value).strip()
    
    def _process_assignment_row(self, row, row_number):
        """处理单行分组分配数据"""
        from groups.models import StudentGroupAssignment
        
        # 安全的字段提取和转换
        notification_number = self._safe_str_conversion(row['通知书编号'], '通知书编号', row_number)
        group_name = self._safe_str_conversion(row['分组名称'], '分组名称', row_number)
        
        # 验证必填字段
        if not notification_number:
            raise ValueError("通知书编号不能为空")
        if not group_name:
            raise ValueError("分组名称不能为空")
        
        # 去除可能的科学计数法格式（如1.0 -> 1）
        if notification_number.endswith('.0'):
            notification_number = notification_number[:-2]
        
        # 查找学生 - 更详细的错误信息
        try:
            student = Student.objects.get(notification_number=notification_number)
        except Student.DoesNotExist:
            # 尝试查找相似的通知书编号，提供有用的提示
            similar_students = Student.objects.filter(
                notification_number__icontains=notification_number[:3] if len(notification_number) >= 3 else notification_number
            )[:3]
            
            error_msg = f"找不到通知书编号为 '{notification_number}' 的学生"
            if similar_students:
                similar_numbers = [s.notification_number for s in similar_students]
                error_msg += f"。系统中相似的通知书编号: {', '.join(similar_numbers)}"
            else:
                # 提示检查格式
                error_msg += f"。请检查通知书编号格式是否正确"
            
            raise ValueError(error_msg)
        
        # 查找分组 - 更详细的错误信息
        try:
            group = GroupInfo.objects.get(group_name=group_name)
        except GroupInfo.DoesNotExist:
            # 尝试查找相似的分组名称
            similar_groups = GroupInfo.objects.filter(
                group_name__icontains=group_name[:3] if len(group_name) >= 3 else group_name
            )[:3]
            
            error_msg = f"找不到名称为 '{group_name}' 的分组"
            if similar_groups:
                similar_names = [g.group_name for g in similar_groups]
                error_msg += f"。系统中相似的分组名称: {', '.join(similar_names)}"
            else:
                all_groups = GroupInfo.objects.values_list('group_name', flat=True)[:5]
                if all_groups:
                    error_msg += f"。系统中现有分组: {', '.join(all_groups)}"
            
            raise ValueError(error_msg)
        
        # 检查是否已经分配过（相同分组）
        existing_assignment = StudentGroupAssignment.objects.filter(
            student=student,
            group_info=group,
            is_active=True
        ).first()
        
        if existing_assignment:
            self.warnings.append(f"第{row_number}行: 学生 {student.name}(通知书编号: {notification_number}) 已分配到分组 '{group_name}'，跳过")
            self.skip_count += 1
            return
        
        # 检查学生是否已经分配到其他活跃的分组
        existing_active_assignment = StudentGroupAssignment.objects.filter(
            student=student,
            is_active=True
        ).first()
        
        if existing_active_assignment:
            # 提供更详细的冲突信息
            self.warnings.append(f"第{row_number}行: 学生 {student.name}(通知书编号: {notification_number}) 已分配到其他分组 '{existing_active_assignment.group_info.group_name}'，无法重复分配到 '{group_name}'，跳过")
            self.skip_count += 1
            return
        
        # 处理备注（可选字段）
        remarks = ''
        if '备注' in row and pd.notna(row['备注']):
            remarks = self._safe_str_conversion(row['备注'], '备注', row_number)
        
        # 创建分组分配记录
        assignment = StudentGroupAssignment(
            student=student,
            group_info=group,
            remarks=remarks,
            is_active=True
        )
        
        try:
            assignment.full_clean()
            assignment.save()
            self.success_count += 1
        except Exception as e:
            raise ValueError(f"保存分配记录失败: {str(e)}")
    
    def preview_assignments_from_excel(self, file_path):
        """预览Excel文件中的学生分组分配信息，不实际导入"""
        try:
            from groups.models import StudentGroupAssignment
            
            # 读取Excel文件，确保数据类型正确
            df = pd.read_excel(file_path, dtype=str)
            
            preview_records = []
            valid_count = 0
            warning_count = 0
            error_count = 0
            
            # 统计信息
            summary = {
                'new_assignments': 0,
                'duplicate_assignments': 0,
                'conflicting_assignments': 0,
                'invalid_students': 0,
                'invalid_groups': 0,
            }
            
            # 检查文件是否为空
            if df.empty:
                raise ValueError("Excel文件为空或没有数据")
            
            # 验证必要的列
            required_columns = ['通知书编号', '分组名称']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                available_columns = list(df.columns)
                raise ValueError(f"缺少必要的列: {', '.join(missing_columns)}。文件中可用的列: {', '.join(available_columns)}")
            
            # 数据预处理：移除完全空白的行
            df = df.dropna(how='all')
            
            # 预览每一行数据
            for index, row in df.iterrows():
                try:
                    # 跳过空行
                    if pd.isna(row['通知书编号']) and pd.isna(row['分组名称']):
                        continue
                    
                    record = self._preview_assignment_row(row, index + 2, summary)
                    preview_records.append(record)
                    
                    # 统计状态
                    if record['status'] == 'success':
                        valid_count += 1
                    elif record['status'] == 'warning':
                        warning_count += 1
                    elif record['status'] == 'error':
                        error_count += 1
                        
                except Exception as e:
                    preview_records.append({
                        'row_number': index + 2,
                        'notification_number': str(row.get('通知书编号', '')),
                        'group_name': str(row.get('分组名称', '')),
                        'remarks': str(row.get('备注', '')),
                        'status': 'error',
                        'message': f"行数据处理失败: {str(e)}",
                        'student_name': None,
                        'existing_group': None,
                    })
                    error_count += 1
            
            return {
                'success': True,
                'total_rows': len(preview_records),
                'valid_count': valid_count,
                'warning_count': warning_count,
                'error_count': error_count,
                'records': preview_records,
                'summary': summary,
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'total_rows': 0,
                'valid_count': 0,
                'warning_count': 0,
                'error_count': 0,
                'records': [],
                'summary': {
                    'new_assignments': 0,
                    'duplicate_assignments': 0,
                    'conflicting_assignments': 0,
                    'invalid_students': 0,
                    'invalid_groups': 0,
                },
            }
    
    def _preview_assignment_row(self, row, row_number, summary):
        """预览单行分组分配数据"""
        from groups.models import StudentGroupAssignment
        
        # 安全的字段提取和转换
        notification_number = self._safe_str_conversion(row['通知书编号'], '通知书编号', row_number)
        group_name = self._safe_str_conversion(row['分组名称'], '分组名称', row_number)
        remarks = self._safe_str_conversion(row.get('备注', ''), '备注', row_number)
        
        # 初始化记录
        record = {
            'row_number': row_number,
            'notification_number': notification_number,
            'group_name': group_name,
            'remarks': remarks,
            'status': 'error',
            'message': '',
            'student_name': None,
            'existing_group': None,
        }
        
        # 验证必填字段
        if not notification_number:
            record['message'] = "通知书编号不能为空"
            return record
        if not group_name:
            record['message'] = "分组名称不能为空"
            return record
        
        # 去除可能的科学计数法格式
        if notification_number.endswith('.0'):
            notification_number = notification_number[:-2]
            record['notification_number'] = notification_number
        
        # 查找学生
        try:
            student = Student.objects.get(notification_number=notification_number)
            record['student_name'] = student.name
        except Student.DoesNotExist:
            summary['invalid_students'] += 1
            similar_students = Student.objects.filter(
                notification_number__icontains=notification_number[:3] if len(notification_number) >= 3 else notification_number
            )[:3]
            
            if similar_students:
                similar_numbers = [s.notification_number for s in similar_students]
                record['message'] = f"找不到通知书编号为 '{notification_number}' 的学生。相似编号: {', '.join(similar_numbers)}"
            else:
                record['message'] = f"找不到通知书编号为 '{notification_number}' 的学生"
            return record
        
        # 查找分组
        try:
            group = GroupInfo.objects.get(group_name=group_name)
        except GroupInfo.DoesNotExist:
            summary['invalid_groups'] += 1
            similar_groups = GroupInfo.objects.filter(
                group_name__icontains=group_name[:3] if len(group_name) >= 3 else group_name
            )[:3]
            
            if similar_groups:
                similar_names = [g.group_name for g in similar_groups]
                record['message'] = f"找不到名称为 '{group_name}' 的分组。相似分组: {', '.join(similar_names)}"
            else:
                all_groups = GroupInfo.objects.values_list('group_name', flat=True)[:5]
                if all_groups:
                    record['message'] = f"找不到名称为 '{group_name}' 的分组。现有分组: {', '.join(all_groups)}"
                else:
                    record['message'] = f"找不到名称为 '{group_name}' 的分组"
            return record
        
        # 检查是否已经分配过（相同分组）
        existing_assignment = StudentGroupAssignment.objects.filter(
            student=student,
            group_info=group,
            is_active=True
        ).first()
        
        if existing_assignment:
            summary['duplicate_assignments'] += 1
            record['status'] = 'warning'
            record['message'] = f"学生已分配到该分组"
            record['existing_group'] = group_name
            return record
        
        # 检查学生是否已经分配到其他活跃的分组
        existing_active_assignment = StudentGroupAssignment.objects.filter(
            student=student,
            is_active=True
        ).first()
        
        if existing_active_assignment:
            summary['conflicting_assignments'] += 1
            record['status'] = 'warning'
            record['message'] = f"学生已分配到其他分组: {existing_active_assignment.group_info.group_name}"
            record['existing_group'] = existing_active_assignment.group_info.group_name
            return record
        
        # 可以正常分配
        summary['new_assignments'] += 1
        record['status'] = 'success'
        record['message'] = '可以导入'
        
        return record

class ExcelTemplateGenerator:
    """Excel模板生成器"""
    
    @staticmethod
    def generate_student_template(file_path):
        """生成学生信息导入模板"""
        data = {
            '姓名': ['张三', '李四', '王五'],
            '身份证号': ['110101200001011234', '110101200002022345', '110101200003033456'],
            '通知书编号': ['A001', 'A002', 'A003'],
            '手机号码': ['13800138001', '13800138002', ''],
            '邮箱': ['zhangsan@example.com', '', ''],
        }
        
        df = pd.DataFrame(data)
        
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='学生信息')
            
            # 添加说明工作表
            instructions = pd.DataFrame({
                '字段名': ['姓名', '身份证号', '通知书编号', '手机号码', '邮箱'],
                '是否必填': ['是', '是', '是', '否', '否'],
                '说明': [
                    '学生真实姓名',
                    '18位身份证号码，用于自动计算性别和年龄',
                    '学生的通知书编号，必须唯一',
                    '11位手机号码，可留空',
                    '电子邮箱地址，可留空'
                ]
            })
            instructions.to_excel(writer, index=False, sheet_name='导入说明')
    
    @staticmethod
    def generate_group_template(file_path):
        """生成分组信息导入模板"""
        data = {
            '分组名称': ['计算机科学A组', '数学与应用数学B组', '物理学C组'],
            '分组教师': ['陈老师', '刘老师', '张老师'],
            '教师联系方式': ['13800138001', '13800138002', '13800138003'],
            '报到地点': ['教学楼A201', '教学楼B301', '教学楼C401'],
        }
        
        df = pd.DataFrame(data)
        
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='分组信息')
            
            # 添加说明工作表
            instructions = pd.DataFrame({
                '字段名': ['分组名称', '分组教师', '教师联系方式', '报到地点'],
                '是否必填': ['是', '是', '是', '是'],
                '说明': [
                    '分组名称，必须唯一',
                    '负责教师姓名',
                    '教师手机号码（11位）',
                    '学生报到地点'
                ]
            })
            instructions.to_excel(writer, index=False, sheet_name='导入说明')
    
    @staticmethod
    def generate_assignment_template(file_path):
        """生成学生分组分配导入模板"""
        # 示例数据，包含更多格式说明
        data = {
            '通知书编号': ['A001', 'A002', 'A003', 'B001', 'B002'],
            '分组名称': ['计算机科学A组', '计算机科学A组', '计算机科学A组', '数学与应用数学B组', '数学与应用数学B组'],
            '备注': ['', '特殊情况', '', '', '需要特别关注'],
        }
        
        df = pd.DataFrame(data)
        
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='学生分组分配')
            
            # 添加详细的说明工作表
            instructions = pd.DataFrame({
                '字段名': ['通知书编号', '分组名称', '备注'],
                '是否必填': ['是', '是', '否'],
                '数据格式': ['文本格式', '文本格式', '文本格式'],
                '说明': [
                    '学生的通知书编号，必须在系统中存在。注意：如编号以字母开头（如A001），请确保Excel单元格格式为"文本"',
                    '分组名称，必须在系统中存在，名称必须完全匹配',
                    '备注信息，可选填'
                ],
                '示例': ['A001, B002, C123', '计算机科学A组', '特殊情况说明']
            })
            instructions.to_excel(writer, index=False, sheet_name='导入说明')
            
            # 添加常见问题说明
            troubleshooting = pd.DataFrame({
                '常见问题': [
                    '通知书编号被Excel自动转为数字',
                    '找不到学生信息',
                    '找不到分组信息',
                    '学生已分配到其他分组',
                    '导入失败但没有错误信息'
                ],
                '解决方案': [
                    '在Excel中将通知书编号列格式设置为"文本"，或在编号前加英文单引号(\')',
                    '检查通知书编号是否正确，确保学生信息已导入系统',
                    '检查分组名称是否正确，确保分组信息已创建',
                    '一个学生只能分配到一个分组，需要先移除现有分配',
                    '检查Excel文件格式，确保必填字段不为空'
                ]
            })
            troubleshooting.to_excel(writer, index=False, sheet_name='常见问题')
            
            # 设置列宽以提高可读性
            workbook = writer.book
            for sheet_name in ['学生分组分配', '导入说明', '常见问题']:
                worksheet = writer.sheets[sheet_name]
                for column_cells in worksheet.columns:
                    length = max(len(str(cell.value or '')) for cell in column_cells)
                    worksheet.column_dimensions[column_cells[0].column_letter].width = min(50, max(12, length + 2))
