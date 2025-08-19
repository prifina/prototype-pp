import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, TrendingUp, Users, MessageSquare, Clock, ThumbsUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Mock data
const adoptionData = [
  { stage: 'Invited', count: 100, percentage: 100 },
  { stage: 'Onboarded', count: 85, percentage: 85 },
  { stage: 'First Chat', count: 72, percentage: 72 },
  { stage: 'Regular Users', count: 58, percentage: 58 }
];

const dailyActivity = [
  { day: 'Mon', messages: 45, users: 12 },
  { day: 'Tue', messages: 52, users: 15 },
  { day: 'Wed', messages: 38, users: 11 },
  { day: 'Thu', messages: 61, users: 18 },
  { day: 'Fri', messages: 73, users: 21 },
  { day: 'Sat', messages: 29, users: 8 },
  { day: 'Sun', messages: 31, users: 9 }
];

const intentDistribution = [
  { name: 'Sleep', value: 35, color: '#8884d8' },
  { name: 'Nutrition', value: 28, color: '#82ca9d' },
  { name: 'Exercise', value: 22, color: '#ffc658' },
  { name: 'Recovery', value: 15, color: '#ff7c7c' }
];

const mockProductions = [
  { id: 'all', name: 'All Productions' },
  { id: 'demo-1', name: 'Demo Production' },
  { id: 'phantom-2024', name: 'Phantom of the Opera 2024' }
];

export const Analytics = () => {
  const [selectedProduction, setSelectedProduction] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');

  const handleExportCSV = () => {
    console.log('Exporting CSV for production:', selectedProduction);
    // TODO: Implement CSV export
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="min-w-[200px]">
            <Select value={selectedProduction} onValueChange={setSelectedProduction}>
              <SelectTrigger>
                <SelectValue placeholder="Select production" />
              </SelectTrigger>
              <SelectContent>
                {mockProductions.map((prod) => (
                  <SelectItem key={prod.id} value={prod.id}>
                    {prod.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="min-w-[150px]">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">58</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              +8% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1s</div>
            <p className="text-xs text-muted-foreground">
              -0.3s from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              +3% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Adoption Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Adoption Funnel</CardTitle>
          <CardDescription>
            User journey from invitation to regular usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adoptionData.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {stage.stage}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {stage.count} users
                    </span>
                  </div>
                  <span className="text-sm font-medium">{stage.percentage}%</span>
                </div>
                <Progress value={stage.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Messages and active users by day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="messages" fill="#8884d8" name="Messages" />
                <Bar dataKey="users" fill="#82ca9d" name="Active Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Intent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation Topics</CardTitle>
            <CardDescription>Distribution of conversation intents</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={intentDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {intentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Policy Health */}
      <Card>
        <CardHeader>
          <CardTitle>Policy Health</CardTitle>
          <CardDescription>
            WhatsApp business policy compliance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Within 24h Window</span>
                <span className="text-sm text-green-600 font-medium">94%</span>
              </div>
              <Progress value={94} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Messages sent within customer service window
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Template Success Rate</span>
                <span className="text-sm text-green-600 font-medium">98%</span>
              </div>
              <Progress value={98} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Template messages delivered successfully
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Opt-out Rate</span>
                <span className="text-sm text-amber-600 font-medium">2%</span>
              </div>
              <Progress value={2} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Users who opted out of WhatsApp messages
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};