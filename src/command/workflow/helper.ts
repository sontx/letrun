const TIME_TRANSFORMER = (value: any) => (value ? new Date(value).toLocaleString() : '');
const DURATION_TRANSFORMER = (value: any) => (value ? `${value} ms` : '');
export const FIELD_TRANSFORMERS: { [key: string]: (value: any) => any } = {
  timeCompleted: TIME_TRANSFORMER,
  timeStarted: TIME_TRANSFORMER,
  timeOpened: TIME_TRANSFORMER,
  handlerDuration: DURATION_TRANSFORMER,
  totalDuration: DURATION_TRANSFORMER,
};
