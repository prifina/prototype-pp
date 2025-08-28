import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, TrendingUp, Users, MessageSquare, Clock, ThumbsUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

export const Analytics = () => {
  const [selectedProduction, setSelectedProduction] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [productions, setProductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductions();
  }, []);

  const loadProductions = async () => {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      const productionOptions = [
        { id: 'all', name: 'All Productions' },
        ...(data || [])
      ];

      setProductions(productionOptions);
    } catch (error) {
      console.error('Error loading productions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    console.log('Exporting CSV for production:', selectedProduction);
    // TODO: Implement CSV export
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

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
                {productions.map((prod) => (
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

      {/* Empty State */}
      <Card>
        <CardContent className="text-center py-12">
          <BarChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Analytics and insights will be available once users start interacting with the system.
          </p>
          <p className="text-sm text-muted-foreground">
            Create productions and onboard users to begin collecting analytics data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};