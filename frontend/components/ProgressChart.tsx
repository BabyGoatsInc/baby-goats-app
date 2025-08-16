import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface ProgressChartProps {
  type: 'line' | 'bar' | 'progress';
  data: any;
  title: string;
  color?: string;
}

export default function ProgressChartComponent({ type, data, title, color = '#4ECDC4' }: ProgressChartProps) {
  const chartConfig = {
    backgroundColor: '#000000',
    backgroundGradientFrom: '#000000',
    backgroundGradientTo: '#111111',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: color,
    },
  };

  const chartWidth = screenWidth - 32;

  if (type === 'progress') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <ProgressChart
          data={data}
          width={chartWidth}
          height={200}
          strokeWidth={12}
          radius={60}
          chartConfig={chartConfig}
          hideLegend={false}
        />
      </View>
    );
  }

  if (type === 'bar') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <BarChart
          data={data}
          width={chartWidth}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={30}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <LineChart
        data={data}
        width={chartWidth}
        height={220}
        chartConfig={chartConfig}
        bezier
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
});