
import {conversion} from '../services/ConversionService';
import type {Request, Response} from 'express';
import {client} from '../database/redis';
import {conversionValidator} from '../validators/conversion';

export async function conversionCurrency(req: Request, res: Response): Promise<any> {
	try {
		const {query} = req;

		await conversionValidator.validate(query);

		const data = {
			from: query.from as string,
			to: query.to as string,
			amount: query.amount as string,
		};

		const response = await client.get(`${data.from}${data.to}`);

		if (!response) {
			const response = await conversion({data});

			await client.set(`${data.from}${data.to}`, JSON.stringify(response));
			await client.expire(`${data.from}${data.to}`, 10);

			return res.status(200).json({response});
		}

		res.status(200).send(response);
	} catch (e: any) {
		const statusCode =  e.statusCode|| 409;

		res.status(statusCode).send({error: e.message})
	} 
}
