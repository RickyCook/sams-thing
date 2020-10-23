import { Button, Divider, Form, Input, message, Modal, Slider, Space, Spin, Tooltip, Typography } from 'antd';
import { CheckCircleOutlined, FallOutlined, FrownOutlined, PlusOutlined, RiseOutlined, SmileOutlined, TeamOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import { useMutation, useQuery, gql } from '@apollo/client';
import { jsx, css } from '@emotion/core';
import styled from '@emotion/styled';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';

import { getError, getOnlyValue } from './gql';

const { TextArea } = Input;
const { Text } = Typography;

const CREATE = gql`
  mutation Create($entry: CreateEntry!) {
    createEntry(entry: $entry) {
      ok
      message
    }
  }
`;

const Title = props => (
  <Text
    css={ props.first ? {} : { marginBottom: '50px' }}
    strong
    { ..._.omit(props, ['first']) }
  />
);

const IconSliderWrapper = styled.div`
  display: flex;
  align-items: center;
  & > *:first-child {
    padding-right: 10px;
  }
  & > *:last-child {
    padding-left: 10px;
  }
`;
const IconSliderInput = props => (
  <Slider { ...props } style={{ flexGrow: 1 }} />
);
const IconSlider = ({ minIcon, maxIcon, ...props }) => (
  <IconSliderWrapper>
    { minIcon }
    <IconSliderInput { ...props } />
    { maxIcon }
  </IconSliderWrapper>
);

const Add = props => {
  const [form] = Form.useForm();

  const initialValues = { happy: 50, social: 50, energy: 50, notes: '' };
  useEffect(() => {
    props.onChange(initialValues, initialValues);
  }, []);

  return (
    <>
      <Form
        layout="vertical"
        form={ form }
        initialValues={ initialValues }
        onValuesChange={ props.onChange }
      >
        <Form.Item name="happy" label="How happy are you right now?">
          <IconSlider
            minIcon={ <FrownOutlined /> }
            maxIcon={ <SmileOutlined /> }
          />
        </Form.Item>
        <Form.Item name="social" label="How social do you feel right now?">
          <IconSlider
            minIcon={ <UserOutlined /> }
            maxIcon={ <TeamOutlined /> }
          />
        </Form.Item>
        <Form.Item name="energy" label="How much energy do you have right now?">
          <IconSlider
            minIcon={ <FallOutlined /> }
            maxIcon={ <RiseOutlined /> }
          />
        </Form.Item>
        <Form.Item name="notes" label="Any optional notes about things you did today?">
          <TextArea />
        </Form.Item>
      </Form>
    </>
  );
}

export const AddButton = props => {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);
  const [values, setValues] = useState(null);

  const [create, createMeta] = useMutation(CREATE);
  const createError = getError(createMeta.data, createMeta.error);

  const save = () => {
    create({ variables: { entry: values } });
  };
  useEffect(() => {
    if (createError) message.error(createError.toString());
  }, [createError]);
  useEffect(() => {
    if (!createMeta.called) return;
    if (createMeta.loading) return;
    const resp = getOnlyValue(createMeta.data);
    if (resp.ok) {
      message.success(resp.message);
      setVisible(false)
    };
  }, [createMeta.loading]);

  return (
    <>
      <Modal
        title="Report your mood"
        visible={ visible }
        okText="Save"
        onOk = { save }
        onCancel={ () => setVisible(false) }
        afterClose={ () => setKey(key+1) }
        confirmLoading={ createMeta.loading }
      >
        <Add key={ key } onChange={ (c, values) => setValues(values) } />
      </Modal>
      <Button
        icon={ <PlusOutlined /> }
        size="large"
        type="primary"
        onClick={ () => setVisible(true) }
      />
    </>
  );
};
