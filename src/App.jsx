import { Button, Divider, Layout, PageHeader, Slider, Typography } from 'antd';
import * as c from '@ant-design/colors';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import styled from '@emotion/styled';
import _ from 'lodash';
import moment from 'moment-timezone';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Chart } from 'react-charts';

import { AddButton } from './Add';
import { getOnlyValue } from './gql';
import { SettingsButton } from './Settings';

const { Title } = Typography;

const EVENTS = gql`
  query GraphData($from: String, $to: String) {
    graphData(from: $from, to: $to) {
      firstEntry {
        created_at
      }
      lastEntry {
        created_at
      }
      entries {
        happy
        social
        energy
        notes
        created_at
      }
    }
  }
`;

const MetricChart = props => {
  const { color, dataKey, data: rawData, ...chartProps } = props;
  const data = useMemo(
    () => [
      {
        color,
        label: dataKey,
        data: rawData
          ? getOnlyValue(rawData).entries.map(
            entry => ({
              primary: new Date(entry.created_at),
              secondary: entry[dataKey] || 0.0000001,
            })
          )
          : [],
      },
    ],
    [rawData]
  );
  if (!rawData) return null;
  return (
    <div style={{ height: '200px' }}>
      <Chart { ...chartProps } data={ data } tooltip />
    </div>
  );
}

const ChartWrapper = styled.div`
  margin-bottom: 50px;
`;

const AllCharts = props => {
  const { rangeFrom, rangeTo } = props;
  console.log(rangeFrom, rangeFrom.toDate(), rangeFrom.valueOf());
  const [
    primaryCursorValue,
    setPrimaryCursorValue,
  ] = useState(null);
  const primaryCursor = useMemo(
    () => ({ value: primaryCursorValue }),
    [primaryCursorValue],
  );
  const onFocus = useCallback(datum => {
    setPrimaryCursorValue(datum ? datum.primary : null);
  }, []);

  const series = useMemo(() => ({
    showPoints: true,
  }), []);
  const axes = useMemo(() => ([
    {
      primary: true,
      type: 'time',
      position: 'bottom',
      hardMin: rangeFrom.valueOf(),
      hardMax: rangeTo.valueOf(),
    },
    { type: 'linear', position: 'left', hardMin: 0, hardMax: 100 },
  ]), [rangeFrom, rangeTo]);
  return (
    <>
      <ChartWrapper>
        <Divider>Happiness</Divider>
        <MetricChart
          { ...{ series, axes, onFocus, primaryCursor }}
          data={ props.data }
          dataKey="happy"
          color={ c.green[5] }
        />
      </ChartWrapper>
      <ChartWrapper>
        <Divider>Sociality</Divider>
        <MetricChart
          { ...{ series, axes, onFocus, primaryCursor }}
          data={ props.data }
          dataKey="social"
          color={ c.blue[5] }
        />
      </ChartWrapper>
      <ChartWrapper>
        <Divider>Energy</Divider>
        <MetricChart
          { ...{ series, axes, onFocus, primaryCursor }}
          data={ props.data }
          dataKey="energy"
          color={ c.orange[5] }
        />
      </ChartWrapper>
    </>
  );
}

export const App = props => {
  const [getEventsRaw, events] = useLazyQuery(EVENTS);
  const getEvents = useMemo(() => _.debounce(getEventsRaw, 500), [getEventsRaw]);
  console.log({events})

  const [daysFilter, setDaysFilter] = useState(14);
  const daysDuration = useMemo(
    () => moment.duration(daysFilter, 'days'),
    [daysFilter],
  );
  const onChange = useCallback(value => setDaysFilter(value));
  const rangeTo = useMemo(() => moment(), []);
  const rangeFrom = useMemo(
    () => rangeTo.clone().subtract(daysDuration),
    [rangeTo, daysDuration],
  );

  useEffect(() => {
    getEvents({ variables: {
      from: rangeFrom.utc().format(),
      to: rangeTo.utc().format(),
    } });
  }, [rangeFrom, rangeTo]);

  return (
    <Layout>
      <Layout.Content>
        <PageHeader
          title="Your moods"
          extra={ [
            <AddButton key="add" />,
            <SettingsButton key="settings" />,
          ] }
      />
      <div style={{ padding: '0px 60px'}}>
        <div style={{ padding: '20px 0px' }}>
          <Slider
            min={ 1 }
            max={ 365 }
            value={ daysFilter }
            marks={{
              1: '1 day',
              30: '1 month',
              185: '6 months',
              365: '1 year',
            }}
            onChange={ onChange }
            reverse
          />
        </div>
        <AllCharts data={ events.data } rangeFrom={ rangeFrom } rangeTo={ rangeTo } />
      </div>
      </Layout.Content>
    </Layout>
  )
};
