import { registerProvider, addTraceIdInRequest } from './tracing/tracing';

const { tracer, api } = registerProvider('observability')

import express, { Express } from "express";
import { logger } from './logger/logging';
import axios from 'axios';
import { fetchRandomMessage } from './service';

const createSpan = (name: string) => {
  const jobName = process.env.JOB_NAME || 'observability';
  const span = tracer.startSpan(name);
  span.setAttribute('job', jobName);
  return span
}

const PORT: number = parseInt(process.env.PORT || "5000");
const app: Express = express();

app.use(addTraceIdInRequest);

app.get('/', async (req, res) => {
  await tracer.startActiveSpan('Get /', async (span) => {
    span.setAttribute('job', 'observability');
    const { traceId } = span.spanContext();
    try {
      const data = await fetchRandomMessage(traceId)
      logger.info('Success fetch to get random messages', { traceId });
      span.setStatus({ code: api.SpanStatusCode.OK });
      res.status(201).send(data.slip.advice);
    } catch (error) {
      logger.error('Error to handle request', {
        traceId: span.spanContext().traceId,
        error: error.message
      });
      span.setStatus({ code: api.SpanStatusCode.ERROR });
      res.status(500).send();
    } finally {
      span.end();
    }
  });
});

app.get("/health-check", (req, res) => {
  const { traceId } = req.headers;

  logger.info('Application Healthy', { traceId });

  res.status(204).send();
});

app.get("/hello", (req, res) => {
  const { traceId } = req.headers;

  logger.info('Hello world!', { traceId });

  res.status(200).send("Hello World");
});

app.get("/error", async (_req, res) => {
  const requestSpan = createSpan('request_received');
  const { traceId } = requestSpan.spanContext();

  try {
    await axios.get('http://error_request.com');
  } catch (error) {
    logger.error('Failed to fetch api', { traceId, error: error.message });
    requestSpan.addEvent('exception', { 'exception.message': error.message, 'exception.stacktrace': error.stack });
    requestSpan.setStatus({ code: api.SpanStatusCode.ERROR });
  }

  requestSpan.end();
  res.status(500).send("Error :(");
});

app.listen(PORT, () => {
  logger.info(`Listening for requests on http://localhost:${PORT}`);
});
