from rest_framework import serializers
from .models import StudySession, StudySessionBreakdown, Categories, Aggregate


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = '__all__'

class StudySessionBreakdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySessionBreakdown
        fields = '__all__'

class AggregateSerializer(serializers.ModelSerializer):
    total_duration = serializers.SerializerMethodField()
    category_durations = serializers.SerializerMethodField()

    class Meta:
        model = Aggregate
        fields = '__all__'

    def get_total_duration(self, obj):
        return str(obj.total_duration)

    def get_category_durations(self, obj):
        return obj.category_durations

