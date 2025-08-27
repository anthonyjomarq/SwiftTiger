import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TechnicianWorkloadChartProps {
  data: Array<{
    name: string;
    assigned: number;
    completed: number;
    inProgress: number;
  }>;
}

const TechnicianWorkloadChart: React.FC<TechnicianWorkloadChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value} jobs
            </p>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total: {payload.reduce((sum: number, entry: any) => sum + entry.value, 0)} jobs
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="stroke-gray-300 dark:stroke-gray-600" 
          />
          <XAxis 
            dataKey="name" 
            className="text-gray-600 dark:text-gray-400"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis 
            className="text-gray-600 dark:text-gray-400"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value: string) => (
              <span className="text-gray-700 dark:text-gray-300 text-sm">
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </span>
            )}
          />
          <Bar 
            dataKey="completed" 
            stackId="a" 
            fill="#10b981" 
            name="completed"
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="inProgress" 
            stackId="a" 
            fill="#f59e0b" 
            name="in progress"
            radius={[0, 0, 0, 0]}
          />
          <Bar 
            dataKey="assigned" 
            stackId="a" 
            fill="#3b82f6" 
            name="assigned"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TechnicianWorkloadChart;