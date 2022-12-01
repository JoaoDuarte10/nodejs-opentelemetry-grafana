require('dotenv').config();
import * as api from '@opentelemetry/api'
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { NodeTracerProvider, BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { logger } from '../logger/logging';
import { getSpanContext } from '@opentelemetry/api/build/src/trace/context-utils';
import { NextFunction, Request, Response } from 'express';

export function registerProvider(serviceName: string) {
    registerInstrumentations({
        instrumentations: [getNodeAutoInstrumentations()],
    });

    const resource =
        Resource.default().merge(
            new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
                [SemanticResourceAttributes.SERVICE_VERSION]: "0.1.0",
            }),
        );

    const hostName = process.env.OTEL_TRACE_HOST || 'tempo'

    const options = {
        tags: [],
        endpoint: `http://${hostName}:14268/api/traces`,
    }

    const exporter = new JaegerExporter(options)
    const processor = new BatchSpanProcessor(exporter);

    const provider = new NodeTracerProvider({
        resource: resource,
    });
    provider.addSpanProcessor(processor);
    provider.register()

    logger.info(`Tracing initialized with job: ${serviceName}`);

    return {
        tracer: api.trace.getTracer(serviceName),
        api: api,
    }
}

export const addTraceIdInRequest = (req: Request, _res: Response, next: NextFunction) => {
    const spanContext = getSpanContext(api.context.active());
    req.headers.traceId = spanContext && spanContext.traceId
    next();
};