import { AppConfig } from "./config";
import { Step, IStep } from "./cucumberTypes";
import { Result, ResultType, HistoryResult } from "./feedback";
import { Dispatcher } from "flux";

export class StepManager {

    private static instance: StepManager;
    private stepRepo: Step[] = [];
    private dirty: boolean = true;

    public static get():StepManager{
        if (!StepManager.instance){
            StepManager.instance = new StepManager();
        }
        return StepManager.instance;
    }

    getSteps():Promise<Step[]>{
        return new Promise((resolve) => {
            if (this.dirty){
                this.fetchSteps(resolve);
            }
            else {
                resolve(this.stepRepo);
            }
        })
    }

    getStepsSync():Step[]{
        return this.stepRepo;
    }


    getSuggestionForArg(step:Step, i:number, stepArgs:string[] = []):Promise<{val: string}[]> | undefined{
        if (step.args){
            const args = step.args;
            
            const arg = args[i];
            if (arg.suggProvider !== ""){
                return new Promise((resolve) => {
                    if (i < 0 || i >= args.length){
                        resolve([]);
                    }
                    else {
                        fetch(`${AppConfig.getServerUrl()}/suggestion`, {
                            method: "POST",
                            body: JSON.stringify({
                                step: step.pattern,
                                args: stepArgs,
                                argId: i
                            })
                        }).then((r => r.json())).then((suggs:string[]) => {
                            resolve(suggs.map((v) => ({val: v})))
                        })
                    }
                });
            }
        } else {
            return undefined;
        }
    }

    fetchSteps(callback:(value?:Step[]) => void | undefined){
        fetch(`${AppConfig.getServerUrl()}/liststeps`).then((r) => r.json()).then((steps:IStep[]) => {
            this.stepRepo = steps.map(Step.fromIStep);
            if (callback){
                callback(this.stepRepo);
            }
            this.dirty = false;
        })
    }

    runStep(step: string):Promise<ResultType> {
        return new Promise((resolve) => {
            fetch(`${AppConfig.getServerUrl()}/runstep`, {
                body: step,
                method: "POST",
            }).then().then((res) => {
                if (res.ok){
                    resolve(ResultType.SUCCESS);
                } else {
                    resolve(ResultType.FAILURE);
                }
            });
        })
        
    }
}