import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Users, Plus, Edit, Settings } from "lucide-react"
import { useState } from "react"

interface FamilyMember {
  id: string
  name: string
  avatar?: string
  age: number
  dietary: string[]
  allergies: string[]
  preferences: string[]
  isActive: boolean
}

export function FamilyProfile() {
  // todo: remove mock functionality
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: "1",
      name: "Sarah (Mom)",
      age: 35,
      dietary: ["Vegetarian"],
      allergies: ["Nuts"],
      preferences: ["Italian", "Mexican", "Asian"],
      isActive: true
    },
    {
      id: "2", 
      name: "Mike (Dad)",
      age: 37,
      dietary: [],
      allergies: [],
      preferences: ["BBQ", "American", "Italian"],
      isActive: true
    },
    {
      id: "3",
      name: "Emma (8)",
      age: 8,
      dietary: [],
      allergies: ["Dairy"],
      preferences: ["Simple", "Mild flavors"],
      isActive: true
    },
    {
      id: "4",
      name: "Jake (12)",
      age: 12,
      dietary: [],
      allergies: [],
      preferences: ["Pizza", "Pasta", "Chicken"],
      isActive: true
    }
  ])

  const [familySettings, setFamilySettings] = useState({
    familySize: 4,
    cookingSkill: "Intermediate",
    budget: "Medium",
    cookingTime: "30-45 mins",
    cuisinePreferences: ["Italian", "American", "Mexican", "Asian"]
  })

  const handleMemberToggle = (id: string) => {
    setFamilyMembers(members =>
      members.map(member =>
        member.id === id ? { ...member, isActive: !member.isActive } : member
      )
    )
    console.log(`Family member ${id} toggled`)
  }

  const activeMembersCount = familyMembers.filter(member => member.isActive).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Family Profile
          </h2>
          <p className="text-muted-foreground">
            Manage family preferences and dietary needs
          </p>
        </div>
        <Button data-testid="button-add-family-member">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Family Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Family Overview</span>
            <Badge variant="secondary">{activeMembersCount} active members</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {familyMembers.map((member) => (
              <Card 
                key={member.id} 
                className={`${member.isActive ? 'border-primary/20 bg-primary/5' : 'opacity-60'}`}
              >
                <CardContent className="pt-6">
                  <div className="text-center space-y-3">
                    <Avatar className="mx-auto h-16 w-16">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-lg">
                        {member.name.split(' ')[0][0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">Age {member.age}</p>
                    </div>

                    <div className="space-y-2 text-left">
                      {member.dietary.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Dietary</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.dietary.map((diet) => (
                              <Badge key={diet} variant="outline" className="text-xs">
                                {diet}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {member.allergies.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Allergies</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.allergies.map((allergy) => (
                              <Badge key={allergy} variant="destructive" className="text-xs">
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <Label className="text-xs">Include in meals</Label>
                        <Switch
                          checked={member.isActive}
                          onCheckedChange={() => handleMemberToggle(member.id)}
                          data-testid={`switch-member-${member.id}`}
                        />
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      data-testid={`button-edit-member-${member.id}`}
                    >
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Family Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cooking Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cooking-skill">Cooking Skill Level</Label>
              <Input 
                id="cooking-skill"
                value={familySettings.cookingSkill}
                readOnly
                className="mt-1"
                data-testid="input-cooking-skill"
              />
            </div>
            
            <div>
              <Label htmlFor="cooking-time">Preferred Cooking Time</Label>
              <Input 
                id="cooking-time"
                value={familySettings.cookingTime}
                readOnly
                className="mt-1"
                data-testid="input-cooking-time"
              />
            </div>

            <div>
              <Label htmlFor="budget">Budget Level</Label>
              <Input 
                id="budget"
                value={familySettings.budget}
                readOnly
                className="mt-1"
                data-testid="input-budget"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cuisine Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label>Family enjoys these cuisines:</Label>
              <div className="flex flex-wrap gap-2">
                {familySettings.cuisinePreferences.map((cuisine) => (
                  <Badge key={cuisine} variant="secondary" className="cursor-pointer">
                    {cuisine}
                  </Badge>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                data-testid="button-edit-cuisines"
              >
                <Edit className="h-3 w-3 mr-2" />
                Edit Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations Settings */}
      <Card>
        <CardHeader>
          <CardTitle>AI Recommendation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Suggest healthy alternatives</Label>
              <p className="text-sm text-muted-foreground">AI will recommend healthier ingredient swaps</p>
            </div>
            <Switch defaultChecked data-testid="switch-healthy-alternatives" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Consider seasonal ingredients</Label>
              <p className="text-sm text-muted-foreground">Prioritize in-season, local ingredients</p>
            </div>
            <Switch defaultChecked data-testid="switch-seasonal-ingredients" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Variety in meal planning</Label>
              <p className="text-sm text-muted-foreground">Avoid repeating similar meals too often</p>
            </div>
            <Switch defaultChecked data-testid="switch-meal-variety" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button 
          size="lg"
          onClick={() => console.log("Saving family profile settings")}
          data-testid="button-save-profile"
        >
          Save Profile Settings
        </Button>
      </div>
    </div>
  )
}