import { useAchievements } from "@/hooks/useAchievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Lock } from "lucide-react";

export const AchievementBadges = () => {
  const { achievements, getAchievementDefinitions, isLoading } = useAchievements();

  const definitions = getAchievementDefinitions();
  const earnedTypes = achievements.map(a => a.achievement_type);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse text-center text-muted-foreground">Loading achievements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {definitions.map((def) => {
            const isEarned = earnedTypes.includes(def.type);
            const earned = achievements.find(a => a.achievement_type === def.type);
            
            return (
              <div
                key={def.type}
                className={`p-3 rounded-lg border text-center transition ${
                  isEarned 
                    ? "bg-primary/10 border-primary/30" 
                    : "bg-muted/30 border-muted opacity-60"
                }`}
              >
                <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isEarned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {isEarned ? <Award className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <p className="font-medium text-sm">{def.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{def.description}</p>
                {isEarned && earned && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Earned {new Date(earned.earned_at).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
