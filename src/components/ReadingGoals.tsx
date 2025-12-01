import { useState } from "react";
import { useReadingGoals } from "@/hooks/useReadingGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const ReadingGoals = () => {
  const { goals, createGoal, deleteGoal, getActiveGoal } = useReadingGoals();
  const [isOpen, setIsOpen] = useState(false);
  const [goalType, setGoalType] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [targetChapters, setTargetChapters] = useState("10");

  const activeGoal = getActiveGoal();

  const handleCreateGoal = async () => {
    await createGoal({
      goalType,
      targetChapters: parseInt(targetChapters),
    });
    setIsOpen(false);
    setTargetChapters("10");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Reading Goals
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Reading Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Goal Type</label>
                  <Select value={goalType} onValueChange={(v: any) => setGoalType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Chapters</label>
                  <Input
                    type="number"
                    value={targetChapters}
                    onChange={(e) => setTargetChapters(e.target.value)}
                    min="1"
                  />
                </div>
                <Button onClick={handleCreateGoal} className="w-full">
                  Create Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeGoal && (
          <div className="p-4 bg-primary/10 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold capitalize">{activeGoal.goal_type} Goal</p>
                <p className="text-sm text-muted-foreground">
                  {activeGoal.current_progress} / {activeGoal.target_chapters} chapters
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteGoal(activeGoal.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Progress
              value={(activeGoal.current_progress / activeGoal.target_chapters) * 100}
            />
            {activeGoal.end_date && (
              <p className="text-xs text-muted-foreground">
                Ends: {new Date(activeGoal.end_date).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {goals.filter(g => g.id !== activeGoal?.id).map((goal) => (
          <div key={goal.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium capitalize">{goal.goal_type} Goal</p>
                <p className="text-xs text-muted-foreground">
                  {goal.current_progress} / {goal.target_chapters} chapters
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteGoal(goal.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Progress
              value={(goal.current_progress / goal.target_chapters) * 100}
              className="h-1"
            />
          </div>
        ))}

        {goals.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No reading goals set. Create one to track your progress!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
