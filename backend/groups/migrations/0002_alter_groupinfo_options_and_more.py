# Generated by Django 5.2.3 on 2025-07-12 05:40

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('groups', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='groupinfo',
            options={'ordering': ['group_name'], 'verbose_name': '分组信息', 'verbose_name_plural': '分组信息'},
        ),
        migrations.RemoveField(
            model_name='groupinfo',
            name='notification_number',
        ),
    ]
