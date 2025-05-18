from rest_framework import serializers
from .models import StudySession, StudySessionBreakdown, Categories, Aggregate


class StudySessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySession
        fields = '__all__'
        read_only_fields = ['id','user', 'total_duration']
    
    def validate(self, data):
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("Start time must be before end time")
        return data


    def create(self, validated_data):  
        return StudySession.objects.create(user=self.context['request'].user, **validated_data)

        
    


    def complete_session(self, instance, validated_data):
        instance.end_time = validated_data.get('end_time')
        instance.status = validated_data.get('status')
        instance.save()
        return instance

        ...
    



class StudySessionBreakdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudySessionBreakdown
        fields = '__all__'

    def validate(self, data):
        user = self.context['request'].user
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        category_id = data.get('category')
        session_id = data.get('study_session')

        try:
            category = Categories.objects.get(id=category_id)

            if category.user.id != user.id:
                raise serializers.ValidationError("This subject doesn't belong to you")

        except Categories.DoesNotExist:
            raise serializers.ValidationError("Subject does not exist")
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("Start time must be before end time")
        
        if start_time and session and start_time < session.start_time:
            raise serializers.ValidationError("Breakdown cannot start before session starts.")

        if end_time and session and end_time > session.end_time:
            raise serializers.ValidationError("Breakdown cannot end after session ends.")
        

        if category not in user.categories.all():
            raise serializers.ValidationError("Subject does not exist")
        
        if session.user != user:
            raise serializers.ValidationError("You do not have permission to access this session.")

        return data
    
    def create(self, validated_data):
        return StudySessionBreakdown.objects.create(**validated_data)
    
    def complete_breakdown(self, instance, validated_data):
        instance.end_time = validated_data.get('end_time')
        instance.save()
        return instance


    


        

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


class CategorySerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Categories
        fields = '__all__'