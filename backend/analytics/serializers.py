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
    category = serializers.PrimaryKeyRelatedField(queryset=Categories.objects.all())
    study_session = serializers.PrimaryKeyRelatedField(queryset=StudySession.objects.all())
    class Meta:
        model = CategoryBlock
        fields = '__all__'

    def validate(self, data):
        user = self.context['request'].user
        
        # For partial updates (like ending a block), only validate end_time
        if self.partial:
            end_time = data.get('end_time')
            if end_time:
                # Get the existing start_time from the instance
                start_time = self.instance.start_time
                if start_time and end_time and start_time >= end_time:
                    raise serializers.ValidationError({
                        "end_time": "End time must be after start time"
                    })
            return data

        # Full validation for creation
        category = data.get('category')
        study_session = data.get('study_session')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if not user.is_superuser:
            if category.user.id != user.id:
                raise serializers.ValidationError({
                    "category": f"Category ownership mismatch: category.user.id={category.user.id}, user.id={user.id}"
                })
            
            if study_session.user != user:
                raise serializers.ValidationError({
                    "session": f"Session ownership mismatch: session.user={study_session.user}, user={user}"
                })

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                "timing": f"Invalid timing: block starts at {start_time}, session starts at {study_session.start_time}"
            })

        return data
    
    def create(self, validated_data):
        # Remove the ID conversion - we want to keep the model instance
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


