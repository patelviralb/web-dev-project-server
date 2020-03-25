import { Controller, Delete, Post, Put } from '@overnightjs/core';
import { Request, Response } from 'express';
import { ResponseHandler } from '../common/ResponseHandler';
import { Answer } from '../entities/answer';
import { AnswerService } from '../services/answerService';
import { Question } from '../entities/question';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import ERROR_CODES from '../constants/errorCodes';

@Controller('api/answers')
export class AnswerController {
    private service: AnswerService;

    constructor() {
        this.service = AnswerService.getInstance();
    }

    @Put(':aid')
    private async updateAnswer(req: Request, resp: Response) {
        const aid: number = parseInt(req.params.aid, 10);
        if (isNaN(aid)) {
            ResponseHandler.sendErrorJson(
                resp,
                'Invalid answer id',
                ERROR_CODES.REQUEST_VALIDATION_ERR,
                400
            );
            return;
        }

        const reqAnswer: Answer = plainToClass(Answer, req.body as Answer);
        try{
            await validateOrReject(reqAnswer)
        } catch(e) {
            ResponseHandler.sendErrorJson(
                resp,
                e,
                ERROR_CODES.REQUEST_VALIDATION_ERR,
                400
            );
            return;
        }

        try {
            const answer: Answer = await this.service.updateAnswerForId(aid, reqAnswer)
            ResponseHandler.sendSuccessJson(resp, answer);

        } catch (e) {
            ResponseHandler.sendErrorJson(resp, e.message);
        }
    }

    @Delete(':aid')
    private async deleteAnswer(req: Request, resp: Response) {
        try {
            const aid: number = parseInt(req.params.aid, 10);
            if (isNaN(aid)) {
                throw Error('Invalid answer id');
            }

            await this.service.deleteAnswerForId(aid);
            ResponseHandler.sendSuccessJson(resp, null);

        } catch (e) {
            ResponseHandler.sendErrorJson(resp, e.message);
        }
    }
}