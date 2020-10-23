import { Button, Descriptions, Divider, Layout, PageHeader, Slider, Typography } from 'antd';
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
              rawData: entry,
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
      <Chart { ...chartProps } data={ data } />
    </div>
  );
}

const ChartWrapper = styled.div`
  margin-bottom: 50px;
`;

const DescriptionsWhite = styled(Descriptions)`
  width: 400px;
  & .ant-descriptions-title,
  & .ant-descriptions-item-label,
  & .ant-descriptions-item-content {
    color: white;
  }
`;

const cc = {
  happy: c.green[5],
  social: c.blue[5],
  energy: c.orange[5],
}

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
  const tooltip = useMemo(() => ({
    render: ({ datum }) => {
      if (!datum) return null;
      const raw = datum.originalDatum.rawData;
      return (
        <DescriptionsWhite title={ moment(raw.created_at).format('ddd Do MMM [at] hh:mma') } size="small">
          <Descriptions.Item label={ <span style={{ color: cc.happy }}>Happiness</span> }>{ raw.happy }</Descriptions.Item>
          <Descriptions.Item label={ <span style={{ color: cc.social }}>Sociality</span> }>{ raw.social }</Descriptions.Item>
          <Descriptions.Item label={ <span style={{ color: cc.energy }}>Energy</span> }>{ raw.energy }</Descriptions.Item>
          { raw.notes && <Descriptions.Item label="Notes" span={ 3 }><pre>{ raw.notes }</pre></Descriptions.Item> }
        </DescriptionsWhite>
      );
    }
  }));
  return (
    <>
      <ChartWrapper>
        <Divider>Happiness</Divider>
        <MetricChart
          { ...{ series, axes, tooltip, onFocus, primaryCursor }}
          data={ props.data }
          dataKey="happy"
          color={ cc.happy }
        />
      </ChartWrapper>
      <ChartWrapper>
        <Divider>Sociality</Divider>
        <MetricChart
          { ...{ series, axes, tooltip, onFocus, primaryCursor }}
          data={ props.data }
          dataKey="social"
          color={ cc.social }
        />
      </ChartWrapper>
      <ChartWrapper>
        <Divider>Energy</Divider>
        <MetricChart
          { ...{ series, axes, tooltip, onFocus, primaryCursor }}
          data={ props.data }
          dataKey="energy"
          color={ cc.energy }
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
