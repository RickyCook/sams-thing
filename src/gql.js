import _ from 'lodash';

export const getOnlyValue = obj => {
  const keys = Object.keys(obj);
  if (keys.length > 1) throw new Error('Too many keys');
  if (keys.legth < 1) throw new Error('Empty object');
  return obj[keys[0]];
}
export const getObject = data => getOnlyValue(_.omit(getOnlyValue(data), ['ok', 'message']));
export const getError = (data, error) => {
  if (error) return error;
  if (!data) return null;
  const { ok, message } = getOnlyValue(data);
  if (!ok) return message;
  return null;
}
