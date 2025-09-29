import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, Heart } from "lucide-react"
import { useState } from "react"

interface RecipeCardProps {
  id: string
  title: string
  image: string
  cookTime: number
  servings: number
  difficulty: "Easy" | "Medium" | "Hard"
  tags: string[]
  isFavorite?: boolean
  onFavoriteToggle?: (id: string) => void
  onClick?: (id: string) => void
}

export function RecipeCard({
  id,
  title,
  image,
  cookTime,
  servings,
  difficulty,
  tags,
  isFavorite = false,
  onFavoriteToggle,
  onClick
}: RecipeCardProps) {
  const [favorite, setFavorite] = useState(isFavorite)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorite(!favorite)
    onFavoriteToggle?.(id)
    console.log(`Recipe ${id} favorite toggled: ${!favorite}`)
  }

  const handleCardClick = () => {
    onClick?.(id)
    console.log(`Recipe ${id} clicked`)
  }

  return (
    <Card 
      className="hover-elevate cursor-pointer overflow-hidden" 
      onClick={handleCardClick}
      data-testid={`card-recipe-${id}`}
    >
      <div className="relative">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-48 object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
          onClick={handleFavoriteClick}
          data-testid={`button-favorite-${id}`}
        >
          <Heart className={`h-4 w-4 ${favorite ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>
      </div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg leading-tight" data-testid={`text-recipe-title-${id}`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{cookTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{servings} servings</span>
          </div>
          <Badge variant="secondary">{difficulty}</Badge>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}