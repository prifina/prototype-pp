import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, FileText, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditLogProps {
  showId: string;
}

export const AuditLog: React.FC<AuditLogProps> = ({ showId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  // Mock audit log data - replace with actual API
  const mockAuditLogs: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      actor: 'admin@productionphysio.com',
      action: 'seat.create',
      entity: 'seat',
      entityId: 'seat-123',
      details: 'Created seat via CSV import (batch: batch-456)',
      ipAddress: '192.168.1.100'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      actor: 'admin@productionphysio.com', 
      action: 'seat.phone_update',
      entity: 'seat',
      entityId: 'seat-123',
      details: 'Updated phone from 07700900123 to +447700900456',
      ipAddress: '192.168.1.100'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      actor: 'system',
      action: 'seat.binding',
      entity: 'seat',
      entityId: 'seat-123',
      details: 'Seat bound to WhatsApp ID: wa.gBEGkYiEB1VVAg',
      ipAddress: 'webhook'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      actor: 'admin@productionphysio.com',
      action: 'seat.revoke',
      entity: 'seat', 
      entityId: 'seat-124',
      details: 'Seat revoked due to policy violation',
      ipAddress: '192.168.1.100'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      actor: 'system',
      action: 'seat.expiry',
      entity: 'seat',
      entityId: 'seat-125',
      details: 'Seat expired automatically at end of duration',
      ipAddress: 'scheduler'
    }
  ];

  useEffect(() => {
    loadAuditLogs();
  }, [showId, searchQuery, actionFilter, entityFilter]);

  const loadAuditLogs = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      let filteredLogs = mockAuditLogs;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.actor.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query) ||
          log.entityId.toLowerCase().includes(query)
        );
      }

      if (actionFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => 
          log.action.startsWith(actionFilter)
        );
      }

      if (entityFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => 
          log.entity === entityFilter
        );
      }

      setLogs(filteredLogs);
      setIsLoading(false);
    }, 500);
  };

  const getActionBadge = (action: string) => {
    const actionTypes = {
      'seat.create': { variant: 'default' as const, label: 'Create' },
      'seat.update': { variant: 'secondary' as const, label: 'Update' },
      'seat.phone_update': { variant: 'secondary' as const, label: 'Phone Update' },
      'seat.binding': { variant: 'default' as const, label: 'Binding' },
      'seat.revoke': { variant: 'destructive' as const, label: 'Revoke' },
      'seat.expiry': { variant: 'outline' as const, label: 'Expiry' },
      'show.create': { variant: 'default' as const, label: 'Create Show' },
      'show.update': { variant: 'secondary' as const, label: 'Update Show' },
      'import.csv': { variant: 'default' as const, label: 'CSV Import' }
    };

    const actionType = actionTypes[action as keyof typeof actionTypes] || 
      { variant: 'outline' as const, label: action };

    return (
      <Badge variant={actionType.variant} className="text-xs">
        {actionType.label}
      </Badge>
    );
  };

  const exportAuditLog = () => {
    const csvContent = [
      'Timestamp,Actor,Action,Entity,Entity ID,Details,IP Address',
      ...logs.map(log => 
        `"${log.timestamp}","${log.actor}","${log.action}","${log.entity}","${log.entityId}","${log.details}","${log.ipAddress || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Audit Log
        </CardTitle>
        <CardDescription>
          Track all administrative actions and system events for security and compliance
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by actor, action, or details..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="seat">Seat Actions</SelectItem>
              <SelectItem value="show">Show Actions</SelectItem>
              <SelectItem value="import">Import Actions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="seat">Seats</SelectItem>
              <SelectItem value="show">Shows</SelectItem>
              <SelectItem value="profile">Profiles</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportAuditLog}
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Audit Log Table */}
        <div className="border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading audit log...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 space-y-2">
              <div className="text-muted-foreground">No audit entries found</div>
              <p className="text-sm text-muted-foreground">
                {searchQuery || actionFilter !== 'all' || entityFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Audit entries will appear here as actions are performed'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm font-mono">
                      {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {log.actor === 'system' ? (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        ) : (
                          <span>{log.actor}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <div className="font-medium">{log.entity}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {log.entityId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-md">
                      <div className="truncate" title={log.details}>
                        {log.details}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ipAddress === 'webhook' ? (
                        <Badge variant="outline" className="text-xs">
                          Webhook
                        </Badge>
                      ) : log.ipAddress === 'scheduler' ? (
                        <Badge variant="outline" className="text-xs">
                          Scheduler
                        </Badge>
                      ) : (
                        log.ipAddress || '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          Showing {logs.length} audit entries
          {(searchQuery || actionFilter !== 'all' || entityFilter !== 'all') && (
            <span> (filtered)</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};