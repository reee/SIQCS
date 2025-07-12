from django.contrib import admin
from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'notification_number', 'id_card_number', 'gender', 'age', 'residence_status', 
        'height', 'weight', 'bmi', 'uniform_purchase', 'created_at'
    ]
    list_filter = ['gender', 'residence_status', 'uniform_purchase', 'created_at']
    search_fields = ['name', 'id_card_number', 'notification_number']
    readonly_fields = ['gender', 'age', 'bmi', 'created_at', 'updated_at']
    
    fieldsets = (
        ('基础信息', {
            'fields': ('name', 'notification_number', 'id_card_number', 'gender')
        }),
        ('生活信息', {
            'fields': ('residence_status', 'height', 'weight', 'uniform_purchase')
        }),
        ('兴趣特长', {
            'fields': ('interests_talents',)
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def age(self, obj):
        return obj.age
    age.short_description = '年龄'
    
    def bmi(self, obj):
        return obj.bmi
    bmi.short_description = 'BMI指数'
