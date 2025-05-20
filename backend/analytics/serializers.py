from rest_framework import serializers
from .models import StudySession, CategoryBlock, Categories, Aggregate


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
        instance.status = validated_data.get('status', 'completed')
        instance.save()
        return instance

        ...
    



class CategoryBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryBlock
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
        
        try:
            study_session = StudySession.objects.get(id=session_id)
            if start_time and study_session and start_time < study_session.start_time:
                raise serializers.ValidationError("Category block cannot start before session starts.")

            if end_time and study_session and study_session.end_time and end_time > study_session.end_time:
                raise serializers.ValidationError("Category block cannot end after session ends.")
            
            if study_session.user != user:
                raise serializers.ValidationError("You do not have permission to access this session.")
        except StudySession.DoesNotExist:
            raise serializers.ValidationError("Study session does not exist")

        if category not in user.categories.all():
            raise serializers.ValidationError("Subject does not exist")
        
        return data
    
    def create(self, validated_data):
        return CategoryBlock.objects.create(**validated_data)
    
    def complete_category_block(self, instance, validated_data):
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