import { Service, Model, ServiceResult } from "./Service";
import { ResultType } from "../feedback";

export class UnknownOpService extends Service<ServiceResult> {
    canHandle(line: string): boolean {
        return true;
    }    
    
    handle(model: Model, from: number): ResultType {
        this.consumeLine(model, from);
        return ResultType.SUCCESS;
    }


}