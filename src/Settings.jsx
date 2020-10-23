import { Button, Divider, message, Modal, Space, Spin, Tooltip } from 'antd';
import { CheckCircleOutlined, SettingFilled, WarningOutlined } from '@ant-design/icons';
import { useMutation, useQuery, gql } from '@apollo/client';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';

import { getError, getOnlyValue } from './gql';

const DB_OK = gql`
  query DbOk {
    isDatabaseOK {
      ok
      message
    }
  }
`;
const MIGRATE = gql`
  mutation Migrate {
    migrate {
      ok
      message
    }
  }
`;
const ROLLBACK = gql`
  mutation Rollback {
    rollback {
      ok
      message
    }
  }
`;
const RESET = gql`
  mutation Reset {
    reset {
      ok
      message
    }
  }
`;

const dbActionFields = ['called', 'data', 'error', 'loading'];
const Settings = props => {
  const ok = useQuery(DB_OK);
  const [ reset, rs ] = useMutation(RESET);
  const [ rollback, rb ] = useMutation(ROLLBACK);
  const [ migrate, up ] = useMutation(MIGRATE);

  // Actions
  for (const { actions, called, data, error, loading } of [
    { ..._.pick(rs, dbActionFields), actions: [props.onReset, props.onAction] },
    { ..._.pick(rb, dbActionFields), actions: [props.onRollback, props.onAction] },
    { ..._.pick(up, dbActionFields), actions: [props.onUpgrade, props.onAction] },
  ]) {
    /* eslint-disable react-hooks/rules-of-hooks */
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
      if (!called || loading) return;

      const finalError = getError(data, error)
      if (finalError) {
        console.log({error, data, finalError})
        message.error(`Database error: ${finalError.toString()}`);
        if (props.onError) props.onError(finalError);
      } else {
        for (const fn of actions) {
          if (fn) fn();
        }
      }
    }, [called, data, error, loading]);
    useEffect(() => {
      if (called && !loading) ok.refetch()
    }, [loading]);
    /* eslint-enable react-hooks/rules-of-hooks */
    /* eslint-enable react-hooks/exhaustive-deps */
  }

  // DB Status
  const okError = getError(ok.data, ok.error);
  const okObj = ok.data ? getOnlyValue(ok.data) : null;

  useEffect(() => {
    if (okError) message.error(`Error getting DB status: ${okError}`);
  }, [okError]);

  const dangerError = !!ok.error;
  const warnError = okObj && !okObj.ok;
  const noErrors = !dangerError && !warnError
  const disabled = rs.loading || rb.loading || up.loading || !!ok.error;

  return (
    <>
      <Divider orientation="left" plain>
        <Space>
          Database
          <Spin spinning={ ok.loading } />
          { dangerError && (
            <Tooltip title={ `${ok.error}` }>
              <WarningOutlined style={{ color: 'red'}} />
            </Tooltip>
          ) }
          { warnError && (
            <Tooltip title={ okObj.message }>
              <WarningOutlined style={{ color: 'orange' }} />
            </Tooltip>
          ) }
          { noErrors && (
            <CheckCircleOutlined style={{ color: 'green' }} />
          ) }
        </Space>
      </Divider>
      <Space>
      <Button disabled={ disabled } loading={ rs.loading } onClick={ () => reset() } danger>Reset</Button>
      <Button disabled={ disabled } loading={ rb.loading } onClick={ () => rollback() } danger>Rollback</Button>
      <Button disabled={ disabled } loading={ up.loading } onClick={ () => migrate() } type="primary">Migrate</Button>
      </Space>
    </>
  );
}

export const SettingsButton = props => {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <>
      <Modal
        title="Settings"
        visible={ visible }
        onOk={ () => setVisible(false) }
        onCancel={ () => setVisible(false) }
        cancelButtonProps={{ style: { display: 'none' } }}
        afterClose={ () => setKey(key+1) }
      >
        <Settings key={ key }/>
      </Modal>
      <Button
        icon={ <SettingFilled /> }
        size="large"
        onClick={ () => setVisible(true) }
      />
    </>
  );
};
