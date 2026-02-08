/**
 * Cast Management Page
 * CRUD UI for managing cast members (name, hourly rate, transport fee, PIN, referrals)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  ArrowLeft,
  Plus,
  Pencil,
  UserCheck,
  UserX,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatJPY } from '@/types/billing';
import type { CastMember } from '@/types/cast';

interface CastFormData {
  name: string;
  username: string;
  pin_hash: string;
  hourly_rate: number;
  transport_fee: number;
  referred_by: string;
}

const EMPTY_FORM: CastFormData = {
  name: '',
  username: '',
  pin_hash: '',
  hourly_rate: 4000,
  transport_fee: 0,
  referred_by: '',
};

function useCastMembers() {
  return useQuery({
    queryKey: ['cast_members_all'],
    queryFn: async (): Promise<CastMember[]> => {
      const { data, error } = await supabase
        .from('cast_members')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as CastMember[];
    },
  });
}

function useCreateCast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: CastFormData) => {
      const insertData: Record<string, unknown> = {
        name: form.name,
        pin_hash: form.pin_hash,
        hourly_rate: form.hourly_rate,
        transport_fee: form.transport_fee,
        referred_by: form.referred_by || null,
        is_active: true,
      };
      if (form.username.trim()) {
        insertData.username = form.username;
      }

      const { data, error } = await supabase
        .from('cast_members')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cast_members_all'] });
    },
  });
}

function useUpdateCast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...form }: CastFormData & { id: string }) => {
      const updateData: Record<string, unknown> = {
        name: form.name,
        hourly_rate: form.hourly_rate,
        transport_fee: form.transport_fee,
        referred_by: form.referred_by || null,
      };
      if (form.username.trim()) {
        updateData.username = form.username;
      }
      // Only update PIN if provided
      if (form.pin_hash) {
        updateData.pin_hash = form.pin_hash;
      }

      const { data, error } = await supabase
        .from('cast_members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cast_members_all'] });
    },
  });
}

function useToggleCastActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('cast_members')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cast_members_all'] });
    },
  });
}

function useDeleteCast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cast_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cast_members_all'] });
      queryClient.invalidateQueries({ queryKey: ['casts'] });
    },
  });
}

export default function CastManagementPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useStaffAuth();
  const { data: castMembers, isLoading } = useCastMembers();

  const createCast = useCreateCast();
  const updateCast = useUpdateCast();
  const toggleActive = useToggleCastActive();
  const deleteCast = useDeleteCast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCast, setEditingCast] = useState<CastMember | null>(null);
  const [deletingCast, setDeletingCast] = useState<CastMember | null>(null);
  const [form, setForm] = useState<CastFormData>(EMPTY_FORM);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/staff/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const activeCasts = castMembers?.filter(c => c.is_active) || [];
  const inactiveCasts = castMembers?.filter(c => !c.is_active) || [];

  const handleAdd = () => {
    setEditingCast(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleEdit = (cast: CastMember) => {
    setEditingCast(cast);
    setForm({
      name: cast.name,
      username: cast.username || '',
      pin_hash: '', // Don't pre-fill password
      hourly_rate: cast.hourly_rate,
      transport_fee: cast.transport_fee,
      referred_by: cast.referred_by || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('名前を入力してください');
      return;
    }
    if (!form.username.trim()) {
      toast.error('ユーザー名を入力してください');
      return;
    }
    if (!editingCast && !form.pin_hash.trim()) {
      toast.error('パスワードを入力してください');
      return;
    }

    try {
      if (editingCast) {
        await updateCast.mutateAsync({ id: editingCast.id, ...form });
        toast.success('キャスト情報を更新しました');
      } else {
        await createCast.mutateAsync(form);
        toast.success('キャストを追加しました');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error('保存に失敗しました');
    }
  };

  const handleToggleActive = async (cast: CastMember) => {
    try {
      await toggleActive.mutateAsync({ id: cast.id, is_active: !cast.is_active });
      toast.success(cast.is_active ? '無効にしました' : '有効にしました');
    } catch (error) {
      toast.error('変更に失敗しました');
    }
  };

  const handleDeleteClick = (cast: CastMember) => {
    setDeletingCast(cast);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCast) return;

    try {
      await deleteCast.mutateAsync(deletingCast.id);
      toast.success(`${deletingCast.name} を削除しました`);
      setDeleteDialogOpen(false);
      setDeletingCast(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`削除に失敗しました: ${error?.message || '不明なエラー'}`);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/staff')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-foreground">キャスト管理</h1>
          </div>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-2xl p-4 space-y-4">
        {/* Active Cast */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">
            有効 ({activeCasts.length}名)
          </h2>
          <div className="space-y-2">
            {activeCasts.map(cast => (
              <CastCard
                key={cast.id}
                cast={cast}
                allCasts={castMembers || []}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </div>

        {/* Inactive Cast */}
        {inactiveCasts.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">
              無効 ({inactiveCasts.length}名)
            </h2>
            <div className="space-y-2">
              {inactiveCasts.map(cast => (
                <CastCard
                  key={cast.id}
                  cast={cast}
                  allCasts={castMembers || []}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </div>
        )}

        {castMembers?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              キャストがまだ登録されていません
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCast ? 'キャスト編集' : 'キャスト追加'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="キャスト名"
              />
            </div>

            <div>
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="ログイン用ユーザー名"
              />
            </div>

            <div>
              <Label htmlFor="pin">
                パスワード {editingCast && <span className="text-muted-foreground text-xs">(変更する場合のみ入力)</span>}
              </Label>
              <Input
                id="pin"
                value={form.pin_hash}
                onChange={e => setForm(f => ({ ...f, pin_hash: e.target.value }))}
                placeholder={editingCast ? '変更なし' : 'パスワード'}
                maxLength={32}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="hourly_rate">時給 (円)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={form.hourly_rate}
                  onChange={e => setForm(f => ({ ...f, hourly_rate: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="transport_fee">交通費 (円)</Label>
                <Input
                  id="transport_fee"
                  type="number"
                  value={form.transport_fee}
                  onChange={e => setForm(f => ({ ...f, transport_fee: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="referred_by">紹介者</Label>
              <Select
                value={form.referred_by || 'none'}
                onValueChange={v => setForm(f => ({ ...f, referred_by: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  {castMembers
                    ?.filter(c => c.id !== editingCast?.id && c.is_active)
                    .map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCast.isPending || updateCast.isPending}
            >
              {(createCast.isPending || updateCast.isPending) && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              {editingCast ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>キャストを削除</DialogTitle>
            <DialogDescription>
              本当に {deletingCast?.name} を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteCast.isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteCast.isPending}
            >
              {deleteCast.isPending && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CastCard({
  cast,
  allCasts,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  cast: CastMember;
  allCasts: CastMember[];
  onEdit: (cast: CastMember) => void;
  onToggleActive: (cast: CastMember) => void;
  onDelete: (cast: CastMember) => void;
}) {
  const referrer = cast.referred_by
    ? allCasts.find(c => c.id === cast.referred_by)
    : null;

  return (
    <Card className={!cast.is_active ? 'opacity-60' : ''}>
      <CardContent className="flex items-center justify-between p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{cast.name}</p>
            <Badge variant={cast.is_active ? 'default' : 'secondary'} className="text-[10px]">
              {cast.is_active ? '有効' : '無効'}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            {cast.username && <span>@{cast.username}</span>}
            <span>時給: {formatJPY(cast.hourly_rate)}</span>
            <span>交通費: {formatJPY(cast.transport_fee)}</span>
            {referrer && <span>紹介: {referrer.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cast)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggleActive(cast)}
          >
            {cast.is_active ? (
              <UserX className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <UserCheck className="h-3.5 w-3.5 text-green-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete(cast)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
