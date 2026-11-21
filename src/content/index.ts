/**
 * Bundled content. JSON is validated in CI by `scripts/validate-content.ts` (and in tests),
 * so at runtime it is typed by cast to keep startup fast. Add new article files to ARTICLES.
 */
import foodsJson from './foods.json';
import planBoth from './plans/both.json';
import planFattyLiver from './plans/fattyLiver.json';
import planUricAcid from './plans/uricAcid.json';
import tipsFattyLiver from './tips/fattyLiver.json';
import tipsUricAcid from './tips/uricAcid.json';
import articleAlcoholLiverAndUricAcid from './articles/alcohol-liver-and-uric-acid.json';
import articleAltAstExplained from './articles/alt-ast-explained.json';
import articleCookingOils from './articles/cooking-oils.json';
import articleDiabetesAndFattyLiver from './articles/diabetes-and-fatty-liver.json';
import articleEatingOutAndStreetFood from './articles/eating-out-and-street-food.json';
import articleFamilyHealthyHabits from './articles/family-healthy-habits.json';
import articleFattyLiverInSlimPeople from './articles/fatty-liver-in-slim-people.json';
import articleFattyLiverMythsAndFacts from './articles/fatty-liver-myths-and-facts.json';
import articleFestivalFoodGuide from './articles/festival-food-guide.json';
import articleFestivalsAndWeddings from './articles/festivals-and-weddings.json';
import articleFruitsFructoseAndJuices from './articles/fruits-fructose-and-juices.json';
import articleGoutFlareWhatToDo from './articles/gout-flare-what-to-do.json';
import articleHealthyBreakfastIdeas from './articles/healthy-breakfast-ideas.json';
import articleIndianThaliPlating from './articles/indian-thali-plating.json';
import articleMeatFishAndUricAcid from './articles/meat-fish-and-uric-acid.json';
import articleMillets from './articles/millets.json';
import articleNeverStopMedicines from './articles/never-stop-medicines.json';
import articleProteinForVegetarians from './articles/protein-for-vegetarians.json';
import articlePurineMythsDalTomatoSpinach from './articles/purine-myths-dal-tomato-spinach.json';
import articleReadingYourLabReport from './articles/reading-your-lab-report.json';
import articleRefinedCarbsAndMaida from './articles/refined-carbs-and-maida.json';
import articleSafeWeightLossPace from './articles/safe-weight-loss-pace.json';
import articleSevenDaySampleMenu from './articles/seven-day-sample-menu.json';
import articleSleepAndStress from './articles/sleep-and-stress.json';
import articleSugarMithaiAndDrinks from './articles/sugar-mithai-and-drinks.json';
import articleTeaAndCoffee from './articles/tea-and-coffee.json';
import articleUltrasoundGrades from './articles/ultrasound-grades.json';
import articleUricAcidAndGoutBasics from './articles/uric-acid-and-gout-basics.json';
import articleUricAcidMythsAndFacts from './articles/uric-acid-myths-and-facts.json';
import articleVratFastingTips from './articles/vrat-fasting-tips.json';
import articleWalkingAndExercise from './articles/walking-and-exercise.json';
import articleWaterIntake from './articles/water-intake.json';
import articleWhatIsFattyLiver from './articles/what-is-fatty-liver.json';
import articleWhenToSeeADoctor from './articles/when-to-see-a-doctor.json';
import type { Article, Food, Plan, PlanId, TipsFile } from './schema';

export const FOODS = foodsJson as unknown as readonly Food[];

export const PLANS: Readonly<Record<PlanId, Plan>> = {
  fattyLiver: planFattyLiver as unknown as Plan,
  uricAcid: planUricAcid as unknown as Plan,
  both: planBoth as unknown as Plan,
};

export const TIPS: Readonly<Record<TipsFile['condition'], TipsFile>> = {
  fattyLiver: tipsFattyLiver as unknown as TipsFile,
  uricAcid: tipsUricAcid as unknown as TipsFile,
};

export const ARTICLES = [
  articleWhatIsFattyLiver,
  articleUricAcidAndGoutBasics,
  articleWhenToSeeADoctor,
  articleNeverStopMedicines,
  articleReadingYourLabReport,
  articleAltAstExplained,
  articleUltrasoundGrades,
  articleFattyLiverInSlimPeople,
  articleDiabetesAndFattyLiver,
  articleSafeWeightLossPace,
  articleGoutFlareWhatToDo,
  articlePurineMythsDalTomatoSpinach,
  articleMeatFishAndUricAcid,
  articleProteinForVegetarians,
  articleWaterIntake,
  articleAlcoholLiverAndUricAcid,
  articleSugarMithaiAndDrinks,
  articleFruitsFructoseAndJuices,
  articleRefinedCarbsAndMaida,
  articleCookingOils,
  articleMillets,
  articleIndianThaliPlating,
  articleHealthyBreakfastIdeas,
  articleTeaAndCoffee,
  articleEatingOutAndStreetFood,
  articleFestivalsAndWeddings,
  articleVratFastingTips,
  articleWalkingAndExercise,
  articleSleepAndStress,
  articleFamilyHealthyHabits,
  articleFattyLiverMythsAndFacts,
  articleUricAcidMythsAndFacts,
  articleSevenDaySampleMenu,
  articleFestivalFoodGuide,
] as unknown as readonly Article[];
