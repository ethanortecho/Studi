import React from 'react';
import { View, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

interface FocusPieChartProps {
  data: { label: string; value: number }[];
}

interface ChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export default function FocusPieChart({ data }: FocusPieChartProps) {
  console.log('FocusPieChart received data:', data);
  const screenWidth = Dimensions.get('window').width;

  const chartData: ChartData[] = data.map((item, index) => ({
    name: item.label,
    population: item.value,
    color: getColor(index),
    legendFontColor: '#333',
    legendFontSize: 14,
  }));

  return (
    <View>
      <PieChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="20"
        absolute
      />
    </View>
  );
}

function getColor(index: number): string {
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
  return colors[index % colors.length];
}


