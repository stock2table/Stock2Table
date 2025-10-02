import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Users, Settings } from 'lucide-react';
import type { FamilyMember, UserPreferences } from '@shared/schema';

export default function FamilyPreferencesPage() {
  const { toast } = useToast();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const { data: familyMembers = [], isLoading: membersLoading } = useQuery<FamilyMember[]>({
    queryKey: ['/api/family'],
  });

  const { data: preferences, isLoading: prefsLoading } = useQuery<UserPreferences | null>({
    queryKey: ['/api/preferences'],
  });

  const createMemberMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/family', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family'] });
      setIsAddMemberOpen(false);
      toast({ title: 'Family member added successfully' });
    },
    onError: (error: any) => {
      console.error('Failed to add family member:', error);
      toast({ title: 'Failed to add family member', variant: 'destructive' });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest('PUT', `/api/family/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family'] });
      setEditingMember(null);
      toast({ title: 'Family member updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update family member', variant: 'destructive' });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/family/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/family'] });
      toast({ title: 'Family member removed successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to remove family member', variant: 'destructive' });
    },
  });

  const savePreferencesMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
      toast({ title: 'Preferences saved successfully' });
    },
    onError: (error: any) => {
      console.error('Failed to save preferences:', error);
      toast({ title: 'Failed to save preferences', variant: 'destructive' });
    },
  });

  if (membersLoading || prefsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading preferences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Family Preferences</h1>
        <p className="text-muted-foreground">
          Manage your family members and household preferences to get personalized meal recommendations
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Family Members</CardTitle>
            </div>
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-family-member">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <FamilyMemberForm
                  onSubmit={(data) => createMemberMutation.mutate(data)}
                  isPending={createMemberMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Add your family members and their dietary preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          {familyMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No family members added yet. Click "Add Member" to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`family-member-${member.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{member.name}</h3>
                      {member.age && (
                        <Badge variant="secondary" className="text-xs">
                          Age {member.age}
                        </Badge>
                      )}
                    </div>
                    
                    {member.dietary && member.dietary.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-foreground mr-2">Dietary:</span>
                        {member.dietary.map((item, idx) => (
                          <Badge key={idx} variant="outline" className="mr-1 text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {member.allergies && member.allergies.length > 0 && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-foreground mr-2">Allergies:</span>
                        {member.allergies.map((item, idx) => (
                          <Badge key={idx} variant="destructive" className="mr-1 text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {member.preferences && member.preferences.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground mr-2">Preferences:</span>
                        {member.preferences.map((item, idx) => (
                          <Badge key={idx} className="mr-1 text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingMember(member)}
                          data-testid={`button-edit-member-${member.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <FamilyMemberForm
                          member={member}
                          onSubmit={(data) => updateMemberMutation.mutate({ id: member.id, data })}
                          isPending={updateMemberMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Remove ${member.name} from family members?`)) {
                          deleteMemberMutation.mutate(member.id);
                        }
                      }}
                      data-testid={`button-delete-member-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>Household Preferences</CardTitle>
          </div>
          <CardDescription>
            Set your cooking preferences and meal planning settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HouseholdPreferencesForm
            preferences={preferences}
            onSubmit={(data) => savePreferencesMutation.mutate(data)}
            isPending={savePreferencesMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FamilyMemberForm({ 
  member, 
  onSubmit, 
  isPending 
}: { 
  member?: FamilyMember; 
  onSubmit: (data: any) => void; 
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    age: member?.age?.toString() || '',
    dietary: member?.dietary?.join(', ') || '',
    allergies: member?.allergies?.join(', ') || '',
    preferences: member?.preferences?.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,
      dietary: formData.dietary.split(',').map(s => s.trim()).filter(Boolean),
      allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
      preferences: formData.preferences.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{member ? 'Edit' : 'Add'} Family Member</DialogTitle>
        <DialogDescription>
          {member ? 'Update' : 'Add'} family member information and preferences
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., John, Sarah (Mom)"
            required
            data-testid="input-member-name"
          />
        </div>

        <div>
          <Label htmlFor="age">Age (optional)</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            placeholder="e.g., 8"
            data-testid="input-member-age"
          />
        </div>

        <div>
          <Label htmlFor="dietary">Dietary Restrictions (comma-separated)</Label>
          <Input
            id="dietary"
            value={formData.dietary}
            onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
            placeholder="e.g., Vegetarian, Vegan, Gluten-free"
            data-testid="input-member-dietary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate multiple items with commas
          </p>
        </div>

        <div>
          <Label htmlFor="allergies">Allergies (comma-separated)</Label>
          <Input
            id="allergies"
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            placeholder="e.g., Nuts, Dairy, Shellfish"
            data-testid="input-member-allergies"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate multiple items with commas
          </p>
        </div>

        <div>
          <Label htmlFor="preferences">Food Preferences (comma-separated)</Label>
          <Input
            id="preferences"
            value={formData.preferences}
            onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
            placeholder="e.g., Italian, Mexican, Spicy food"
            data-testid="input-member-preferences"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separate multiple items with commas
          </p>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isPending} data-testid="button-save-member">
            {isPending ? 'Saving...' : member ? 'Update' : 'Add'} Member
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

function HouseholdPreferencesForm({
  preferences,
  onSubmit,
  isPending
}: {
  preferences: UserPreferences | null | undefined;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [formData, setFormData] = useState({
    familySize: preferences?.familySize || 4,
    cookingSkill: preferences?.cookingSkill || 'Intermediate',
    budget: preferences?.budget || 'Medium',
    cookingTime: preferences?.cookingTime || '30 mins',
    cuisinePreferences: preferences?.cuisinePreferences?.join(', ') || '',
    healthyAlternatives: preferences?.healthyAlternatives ?? true,
    seasonalIngredients: preferences?.seasonalIngredients ?? true,
    mealVariety: preferences?.mealVariety ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      cuisinePreferences: formData.cuisinePreferences.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="familySize">Family Size</Label>
          <Input
            id="familySize"
            type="number"
            min="1"
            max="20"
            value={formData.familySize}
            onChange={(e) => setFormData({ ...formData, familySize: parseInt(e.target.value) })}
            data-testid="input-family-size"
          />
        </div>

        <div>
          <Label htmlFor="cookingSkill">Cooking Skill Level</Label>
          <Select
            value={formData.cookingSkill}
            onValueChange={(value) => setFormData({ ...formData, cookingSkill: value })}
          >
            <SelectTrigger id="cookingSkill" data-testid="select-cooking-skill">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="budget">Budget</Label>
          <Select
            value={formData.budget}
            onValueChange={(value) => setFormData({ ...formData, budget: value })}
          >
            <SelectTrigger id="budget" data-testid="select-budget">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cookingTime">Preferred Cooking Time</Label>
          <Select
            value={formData.cookingTime}
            onValueChange={(value) => setFormData({ ...formData, cookingTime: value })}
          >
            <SelectTrigger id="cookingTime" data-testid="select-cooking-time">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15 mins">15 minutes or less</SelectItem>
              <SelectItem value="30 mins">30 minutes</SelectItem>
              <SelectItem value="45 mins">45 minutes</SelectItem>
              <SelectItem value="60 mins">1 hour</SelectItem>
              <SelectItem value="60+ mins">More than 1 hour</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="cuisinePreferences">Cuisine Preferences (comma-separated)</Label>
        <Input
          id="cuisinePreferences"
          value={formData.cuisinePreferences}
          onChange={(e) => setFormData({ ...formData, cuisinePreferences: e.target.value })}
          placeholder="e.g., Italian, Mexican, Asian, Mediterranean"
          data-testid="input-cuisine-preferences"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Separate multiple cuisines with commas
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-medium">Meal Planning Preferences</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="healthyAlternatives">Suggest Healthy Alternatives</Label>
            <p className="text-sm text-muted-foreground">
              Get healthier ingredient swaps and recipes
            </p>
          </div>
          <Switch
            id="healthyAlternatives"
            checked={formData.healthyAlternatives}
            onCheckedChange={(checked) => setFormData({ ...formData, healthyAlternatives: checked })}
            data-testid="switch-healthy-alternatives"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="seasonalIngredients">Prefer Seasonal Ingredients</Label>
            <p className="text-sm text-muted-foreground">
              Prioritize in-season produce
            </p>
          </div>
          <Switch
            id="seasonalIngredients"
            checked={formData.seasonalIngredients}
            onCheckedChange={(checked) => setFormData({ ...formData, seasonalIngredients: checked })}
            data-testid="switch-seasonal-ingredients"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="mealVariety">Maximize Meal Variety</Label>
            <p className="text-sm text-muted-foreground">
              Avoid repeating similar meals
            </p>
          </div>
          <Switch
            id="mealVariety"
            checked={formData.mealVariety}
            onCheckedChange={(checked) => setFormData({ ...formData, mealVariety: checked })}
            data-testid="switch-meal-variety"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full" data-testid="button-save-preferences">
        {isPending ? 'Saving...' : 'Save Preferences'}
      </Button>
    </form>
  );
}
