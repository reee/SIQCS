from rest_framework import serializers
from .models import Student


class StudentSerializer(serializers.ModelSerializer):
    """学生信息序列化器"""
    
    age = serializers.ReadOnlyField()
    bmi = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    residence_status_display = serializers.CharField(source='get_residence_status_display', read_only=True)
    info_status_display = serializers.CharField(source='get_info_status_display', read_only=True)
    
    class Meta:
        model = Student
        fields = [
            'id', 'name', 'id_card_number', 'notification_number', 'gender', 'gender_display',
            'residence_status', 'residence_status_display', 'height', 'weight',
            'uniform_purchase', 'interests_talents', 'phone_number', 'email',
            'info_status', 'info_status_display', 'completion_percentage',
            'import_batch', 'import_row_number', 'age', 'bmi',
            'created_at', 'updated_at', 'profile_completed_at'
        ]
        read_only_fields = [
            'gender', 'info_status', 'import_batch', 'import_row_number',
            'created_at', 'updated_at', 'profile_completed_at'
        ]
    
    def validate_id_card_number(self, value):
        """验证身份证号码格式"""
        if len(value) != 18:
            raise serializers.ValidationError("身份证号码必须为18位")
        
        # 检查前17位是否为数字
        if not value[:17].isdigit():
            raise serializers.ValidationError("身份证号码前17位必须为数字")
        
        # 检查最后一位是否为数字或X
        if not (value[17].isdigit() or value[17].upper() == 'X'):
            raise serializers.ValidationError("身份证号码最后一位必须为数字或X")
        
        return value
    
    def validate_height(self, value):
        """验证身高范围"""
        if value is not None and (value < 50 or value > 250):
            raise serializers.ValidationError("身高应在50-250cm之间")
        return value
    
    def validate_weight(self, value):
        """验证体重范围"""
        if value is not None and (value < 10 or value > 200):
            raise serializers.ValidationError("体重应在10-200kg之间")
        return value
    
    def validate_phone_number(self, value):
        """验证手机号码格式"""
        if value and not value.isdigit():
            raise serializers.ValidationError("手机号码只能包含数字")
        if value and len(value) != 11:
            raise serializers.ValidationError("手机号码必须为11位")
        if value and not value.startswith('1'):
            raise serializers.ValidationError("手机号码必须以1开头")
        return value


class StudentListSerializer(serializers.ModelSerializer):
    """学生列表序列化器（简化版）"""
    
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    residence_status_display = serializers.CharField(source='get_residence_status_display', read_only=True)
    info_status_display = serializers.CharField(source='get_info_status_display', read_only=True)
    age = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Student
        fields = [
            'id', 'name', 'id_card_number', 'gender_display',
            'residence_status_display', 'age', 'uniform_purchase',
            'info_status', 'info_status_display', 'completion_percentage',
            'import_batch'
        ]


class StudentProfileUpdateSerializer(serializers.ModelSerializer):
    """学生资料更新序列化器（仅允许学生自己更新的字段）"""
    
    class Meta:
        model = Student
        fields = [
            'residence_status', 'height', 'weight', 'uniform_purchase',
            'interests_talents', 'phone_number', 'email'
        ]
    
    def validate_height(self, value):
        """验证身高范围"""
        if value is not None and (value < 50 or value > 250):
            raise serializers.ValidationError("身高应在50-250cm之间")
        return value
    
    def validate_weight(self, value):
        """验证体重范围"""
        if value is not None and (value < 10 or value > 200):
            raise serializers.ValidationError("体重应在10-200kg之间")
        return value
    
    def validate_phone_number(self, value):
        """验证手机号码格式"""
        if value and not value.isdigit():
            raise serializers.ValidationError("手机号码只能包含数字")
        if value and len(value) != 11:
            raise serializers.ValidationError("手机号码必须为11位")
        if value and not value.startswith('1'):
            raise serializers.ValidationError("手机号码必须以1开头")
        return value
