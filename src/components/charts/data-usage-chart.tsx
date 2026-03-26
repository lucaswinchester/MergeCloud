'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataUsageChartProps {
  data: Array<{
    name: string;
    usage: number;
    fullDate: string;
  }>;
}

export function DataUsageChart({ data }: DataUsageChartProps) {
  console.log('DataUsageChart - Received data:', data);
  
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center border-2 border-red-500 bg-red-50">
        <p className="text-red-500">No data available for the chart</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full border-2 border-green-500 bg-green-50 p-4">
      <div style={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name"
              tick={{ fill: '#666', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `${Number(value).toFixed(2)} GB`}
              tick={{ fill: '#666', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-2 border rounded shadow">
                      <p className="font-medium">{payload[0].payload.fullDate}</p>
                      <p className="text-sm">
                        Usage: {(Number(payload[0].value)).toFixed(2)} GB
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="usage"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
