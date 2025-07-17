from django.db import models
from django.core.validators import RegexValidator
import re


class Student(models.Model):
    """学生基础信息表"""
    
    GENDER_CHOICES = [
        ('M', '男'),
        ('F', '女'),
    ]
    
    RESIDENCE_CHOICES = [
        ('RESIDENT', '住校'),
        ('NON_RESIDENT', '不住校'),
        ('UNKNOWN', '未填写'),
    ]
    
    INFO_STATUS_CHOICES = [
        ('IMPORTED', '已导入'),
        ('PARTIAL', '部分完成'),
        ('COMPLETE', '信息完整'),
    ]
    
    # 身份证号码验证器
    id_card_validator = RegexValidator(
        regex=r'^\d{17}[\dX]$',
        message='身份证号码格式不正确'
    )
    
    # 基础信息（必填，通过导入获得）
    name = models.CharField('学生姓名', max_length=50)
    id_card_number = models.CharField(
        '身份证号', 
        max_length=18, 
        unique=True,
        validators=[id_card_validator]
    )
    notification_number = models.CharField('通知书编号', max_length=50, unique=True)
    gender = models.CharField('性别', max_length=1, choices=GENDER_CHOICES, editable=False)
    
    # 扩展信息（选填，学生后续补充）
    residence_status = models.CharField(
        '住校情况', 
        max_length=20, 
        choices=RESIDENCE_CHOICES, 
        default='UNKNOWN'
    )
    height = models.PositiveIntegerField('身高(cm)', null=True, blank=True)
    weight = models.PositiveIntegerField('体重(kg)', null=True, blank=True)
    uniform_purchase = models.BooleanField('是否自愿订购校服', null=True, blank=True)
    interests_talents = models.TextField('兴趣特长', blank=True)
    
    # 联系信息（学生补充）
    phone_number = models.CharField('手机号码', max_length=11, blank=True)
    email = models.EmailField('邮箱地址', blank=True)
    
    # 状态管理
    info_status = models.CharField(
        '信息完整度', 
        max_length=20, 
        choices=INFO_STATUS_CHOICES, 
        default='IMPORTED'
    )
    
    # 导入信息
    import_batch = models.CharField('导入批次', max_length=50, blank=True)
    import_row_number = models.PositiveIntegerField('导入行号', null=True, blank=True)
    
    # 系统字段
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    profile_completed_at = models.DateTimeField('资料完成时间', null=True, blank=True)
    
    class Meta:
        verbose_name = '学生信息'
        verbose_name_plural = '学生信息'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.notification_number})"
    
    def save(self, *args, **kwargs):
        """保存时自动处理相关逻辑"""
        # 自动根据身份证号计算性别
        if self.id_card_number:
            self.gender = self._get_gender_from_id_card()
        
        # 自动更新信息完整度状态
        old_status = None
        if self.pk:
            old_status = Student.objects.get(pk=self.pk).info_status
        
        self.info_status = self._calculate_info_status()
        
        # 如果状态变为完整，记录完成时间
        if old_status != 'COMPLETE' and self.info_status == 'COMPLETE':
            from django.utils import timezone
            self.profile_completed_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def _get_gender_from_id_card(self):
        """根据身份证号码计算性别"""
        if len(self.id_card_number) == 18:
            gender_digit = int(self.id_card_number[16])
            return 'M' if gender_digit % 2 == 1 else 'F'
        return 'M'
    
    def _calculate_info_status(self):
        """计算信息完整度状态"""
        # 检查必填的扩展信息是否完整
        required_fields = [
            self.residence_status != 'UNKNOWN',
            self.height is not None,
            self.weight is not None,
            self.uniform_purchase is not None,
        ]
        
        if all(required_fields):
            return 'COMPLETE'
        elif any(required_fields):
            return 'PARTIAL'
        else:
            return 'IMPORTED'
    
    @property
    def completion_percentage(self):
        """计算资料完成百分比"""
        total_fields = 4  # 住校、身高、体重、校服
        completed_fields = 0
        
        if self.residence_status != 'UNKNOWN':
            completed_fields += 1
        if self.height is not None:
            completed_fields += 1
        if self.weight is not None:
            completed_fields += 1
        if self.uniform_purchase is not None:
            completed_fields += 1
            
        return (completed_fields / total_fields) * 100
    
    @property
    def age(self):
        """根据身份证号码计算年龄"""
        if len(self.id_card_number) == 18:
            from datetime import datetime
            birth_year = int(self.id_card_number[6:10])
            birth_month = int(self.id_card_number[10:12])
            birth_day = int(self.id_card_number[12:14])
            
            today = datetime.now()
            birth_date = datetime(birth_year, birth_month, birth_day)
            
            age = today.year - birth_date.year
            if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                age -= 1
            return age
        return None
    
    @property
    def bmi(self):
        """计算BMI指数"""
        if self.height and self.weight:
            height_m = self.height / 100
            return round(self.weight / (height_m ** 2), 2)
        return None
