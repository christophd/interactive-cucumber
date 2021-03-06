import { CucumberService } from "./services/CucumberService";
import { UnknownOpService } from "./services/UnknownOpService";
import { Service, Model, ServiceResult } from "./services/Service";
import { CommentService } from "./services/CommentService";
import { VariableService } from "./services/VariableService";
import { editor } from "monaco-editor";
import * as monaco from "monaco-editor";

export type Subscription = {
    type: typeof Service, 
    callback:(arg:ServiceResult) => void
}

export class Services {

    services:Service<ServiceResult>[] = []
    noopService:Service<ServiceResult>
    static instance:Services;
    subscriptions:Subscription[] = [];

    constructor(){
        this.registerServices();
        this.noopService = this.registerService(new UnknownOpService());
    }

    private registerService<T extends ServiceResult>(svc:Service<T>) : Service<T>{
        this.services.push(svc);
        return svc;
    }

    static get(){
        if (!this.instance){
            this.instance = new Services();
        }
        return this.instance;
    }

    registerServices(){
        this.registerService(new CucumberService());
        this.registerService(new CommentService());
        this.registerService(new VariableService());
    }

    getService(type : typeof Service): Service<any> | undefined {
        return this.services.find(svc => svc instanceof type);
    }

    async provideSuggestions(model: editor.ITextModel, position: monaco.Position, context: monaco.languages.CompletionContext) : Promise<monaco.languages.CompletionItem[]> {
        let sugs : monaco.languages.CompletionItem[] = [];
        const serviceResults = this.services
            .map(svc => svc.provideSuggestions(model, position, context));
        const items = await Promise.all(serviceResults);
        items.forEach(val => val.forEach(s => sugs.push(s)));
        return sugs;
    }

    evaluate(model:Model, from:number){
        const service = this.services.find(s => s.canHandleModel(model, from));
        if (service){
            service.handle(model, from);
        } else {
            this.noopService.handle(model, from);
        }
    }



}