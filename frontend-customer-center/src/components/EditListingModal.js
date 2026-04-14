import React, { useState, useEffect } from 'react';
import {
  Modal, Form, Input, InputNumber, Select, Switch, Button,
  Steps, Typography, Row, Col, Divider, message, Tag, Space,
  Radio, Spin, Image,
} from 'antd';
import {
  EditOutlined, TagsOutlined, DollarOutlined, PictureOutlined,
} from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { colors, radii } from '../theme/tokens';
import etsyApi from '../api/etsyApi';

const { Text } = Typography;
const { TextArea } = Input;
const BRAND = '#6C63FF';

const WHO_MADE_OPTIONS = [
  { value: 'i_did', label: 'I did' },
  { value: 'someone_else', label: 'A member of my shop' },
  { value: 'collective', label: 'Another company or person' },
];

const WHEN_MADE_OPTIONS = [
  { value: 'made_to_order', label: 'Made to order' },
  { value: '2020_2025', label: '2020 – 2025' },
  { value: '2010_2019', label: '2010 – 2019' },
  { value: '2004_2009', label: '2004 – 2009' },
  { value: 'before_2004', label: 'Before 2004' },
  { value: '2000_2003', label: '2000 – 2003' },
  { value: '1990s', label: '1990s' },
  { value: '1980s', label: '1980s' },
  { value: '1970s', label: '1970s' },
  { value: '1960s', label: '1960s' },
  { value: '1950s', label: '1950s' },
  { value: '1940s', label: '1940s' },
  { value: '1930s', label: '1930s' },
  { value: '1920s', label: '1920s' },
  { value: '1910s', label: '1910s' },
  { value: '1900s', label: '1900s' },
];

const EditListingModal = ({ open, onClose, onSuccess, listingId }) => {
  const { isDark } = useTheme();
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [shippingProfiles, setShippingProfiles] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [taxonomyProperties, setTaxonomyProperties] = useState([]);
  const [propsLoading, setPropsLoading] = useState(false);
  const [propertyValues, setPropertyValues] = useState({});
  const [listingData, setListingData] = useState(null);
  const [existingImages, setExistingImages] = useState([]);

  // Load listing data when modal opens
  useEffect(() => {
    if (!open || !listingId) return;
    setFetching(true);
    etsyApi.getListingById(listingId)
      .then(res => {
        const d = res.data;
        setListingData(d);
        setExistingImages(d.images || []);

        // Pre-fill form
        form.setFieldsValue({
          title: d.title || '',
          description: d.description || '',
          tags: d.tags || [],
          materials: d.materials || [],
          price: d.price,
          quantity: d.quantity || 1,
          whoMade: d.whoMade || 'i_did',
          whenMade: d.whenMade || 'made_to_order',
          isSupply: d.isSupply === true,
          shippingProfileId: d.shippingProfileId || undefined,
          personalizationIsRequired: d.personalizationIsRequired || false,
          personalizationInstructions: d.personalizationInstructions || '',
          personalizationCharCountMax: d.personalizationCharCountMax || undefined,
        });

        // Load taxonomy properties if we have a taxonomyId
        if (d.taxonomyId) {
          loadTaxonomyProperties(d.taxonomyId);
        }
      })
      .catch(err => {
        message.error(err?.response?.data?.message || 'Failed to load listing details');
        onClose();
      })
      .finally(() => setFetching(false));
  }, [open, listingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load shipping profiles
  useEffect(() => {
    if (!open || listingData?.isDigital) return;
    setShippingLoading(true);
    etsyApi.getShippingProfiles()
      .then(res => setShippingProfiles(res.data || []))
      .catch(() => {})
      .finally(() => setShippingLoading(false));
  }, [open, listingData?.isDigital]);

  const loadTaxonomyProperties = async (taxonomyId) => {
    if (!taxonomyId) return;
    setPropsLoading(true);
    try {
      const res = await etsyApi.getTaxonomyProperties(taxonomyId);
      setTaxonomyProperties(res.data || []);
    } catch {
      setTaxonomyProperties([]);
    } finally {
      setPropsLoading(false);
    }
  };

  const handlePropertyChange = (propertyId, valueId, option) => {
    const valueName = option?.children || '';
    setPropertyValues(prev => ({
      ...prev,
      [propertyId]: {
        valueIds: valueId ? [valueId] : [],
        values: valueName ? [valueName] : [],
      },
    }));
  };

  const resetForm = () => {
    form.resetFields();
    setStep(0);
    setListingData(null);
    setExistingImages([]);
    setTaxonomyProperties([]);
    setPropertyValues({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const nextStep = async () => {
    try {
      if (step === 0) {
        await form.validateFields(['title', 'description', 'tags']);
      } else if (step === 1) {
        const fieldsToValidate = ['price', 'quantity', 'whoMade', 'whenMade'];
        if (!listingData?.isDigital) fieldsToValidate.push('shippingProfileId');
        await form.validateFields(fieldsToValidate);
      }
      setStep(s => s + 1);
    } catch {
      // validation errors shown by form
    }
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    try {
      const values = form.getFieldsValue(true);
      setLoading(true);

      // Build update payload — only include changed fields
      const payload = {};

      if (values.title !== listingData.title) payload.title = values.title;
      if (values.description !== (listingData.description || '')) payload.description = values.description;
      if (values.price !== listingData.price) payload.price = values.price;
      if (values.quantity !== (listingData.quantity || 1)) payload.quantity = values.quantity;
      if (values.whoMade !== (listingData.whoMade || 'i_did')) payload.whoMade = values.whoMade;
      if (values.whenMade !== (listingData.whenMade || 'made_to_order')) payload.whenMade = values.whenMade;
      if (values.isSupply !== (listingData.isSupply === true)) payload.isSupply = values.isSupply;

      // Tags — compare as sorted strings
      const oldTags = (listingData.tags || []).sort().join(',');
      const newTags = (values.tags || []).sort().join(',');
      if (newTags !== oldTags) payload.tags = values.tags || [];

      // Materials
      const oldMats = (listingData.materials || []).sort().join(',');
      const newMats = (values.materials || []).sort().join(',');
      if (newMats !== oldMats) payload.materials = values.materials || [];

      // Shipping profile (physical only)
      if (!listingData.isDigital && values.shippingProfileId !== listingData.shippingProfileId) {
        payload.shippingProfileId = values.shippingProfileId;
      }

      // Personalization
      const hadPersonalization = listingData.isPersonalizable === true;
      const hasPersonalization = values.personalizationIsRequired === true;
      if (hadPersonalization !== hasPersonalization) {
        payload.isPersonalizable = hasPersonalization;
        payload.personalizationIsRequired = hasPersonalization;
      }
      if (hasPersonalization) {
        if ((values.personalizationInstructions || '') !== (listingData.personalizationInstructions || '')) {
          payload.isPersonalizable = true;
          payload.personalizationIsRequired = true;
          payload.personalizationInstructions = values.personalizationInstructions || '';
        }
        if (values.personalizationCharCountMax && values.personalizationCharCountMax !== listingData.personalizationCharCountMax) {
          payload.personalizationCharCountMax = values.personalizationCharCountMax;
        }
      }

      if (Object.keys(payload).length === 0) {
        // Check if taxonomy properties changed
        const propsToSet = Object.entries(propertyValues)
          .filter(([, val]) => val.valueIds?.length > 0 || val.values?.length > 0)
          .map(([propertyId, val]) => ({
            propertyId: parseInt(propertyId, 10),
            valueIds: val.valueIds || [],
            values: val.values || [],
          }));

        if (propsToSet.length === 0) {
          message.info('No changes detected');
          setLoading(false);
          return;
        }
      }

      // Update listing fields
      if (Object.keys(payload).length > 0) {
        const updateRes = await etsyApi.updateListing(listingId, payload);
        if (!updateRes.success) {
          message.error(updateRes.message || 'Failed to update listing');
          setLoading(false);
          return;
        }
      }

      // Update taxonomy properties if changed
      const propsToSet = Object.entries(propertyValues)
        .filter(([, val]) => val.valueIds?.length > 0 || val.values?.length > 0)
        .map(([propertyId, val]) => ({
          propertyId: parseInt(propertyId, 10),
          valueIds: val.valueIds || [],
          values: val.values || [],
        }));

      if (propsToSet.length > 0) {
        try {
          await etsyApi.setListingProperties(listingId, propsToSet);
        } catch {
          message.warning('Some listing attributes could not be updated');
        }
      }

      message.success('Listing updated successfully!');
      onSuccess?.();
      handleClose();
    } catch (err) {
      message.error(err?.response?.data?.message || err.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'rgba(108,99,255,0.04)' : 'rgba(108,99,255,0.02)';
  const borderColor = isDark ? colors.darkBorder : colors.lightBorder;

  const steps = [
    {
      title: 'Details',
      content: (
        <>
          <Form.Item
            name="title" label="Listing Title"
            rules={[
              { required: true, message: 'Title is required' },
              { min: 10, message: 'Title must be at least 10 characters' },
              { max: 140, message: 'Title cannot exceed 140 characters' },
            ]}
          >
            <Input
              placeholder="e.g. Highland Cow Embroidery Design"
              maxLength={140}
              showCount
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="description" label="Description"
            rules={[
              { required: true, message: 'Description is required' },
              { min: 20, message: 'Description must be at least 20 characters' },
            ]}
          >
            <TextArea
              placeholder="Describe your product in detail..."
              rows={6}
              maxLength={10000}
              showCount
            />
          </Form.Item>

          {/* Show current category as read-only for active listings */}
          {listingData?.category && (
            <div style={{
              background: cardBg, borderRadius: radii.sm, padding: 12,
              border: `1px solid ${borderColor}`, marginBottom: 16,
            }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Category</Text>
              <Text strong>{listingData.category}</Text>
            </div>
          )}

          <Form.Item
            name="tags" label={<span>Tags <Text type="secondary" style={{ fontSize: 12 }}>(up to 13)</Text></span>}
            rules={[{ required: true, message: 'Add at least one tag' }]}
          >
            <Select
              mode="tags"
              placeholder="Type a tag and press Enter"
              maxTagCount={13}
              tokenSeparators={[',']}
              style={{ width: '100%' }}
              maxCount={13}
              suffixIcon={<TagsOutlined />}
            />
          </Form.Item>

          {taxonomyProperties.length > 0 && (
            <div style={{
              background: cardBg, borderRadius: radii.sm, padding: 16,
              border: `1px solid ${borderColor}`, marginBottom: 16,
            }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>
                Category Attributes
              </Text>
              <Row gutter={16}>
                {taxonomyProperties.map(prop => (
                  <Col xs={24} sm={12} key={prop.propertyId}>
                    <Form.Item
                      label={prop.displayName || prop.name}
                      required={prop.isRequired}
                      style={{ marginBottom: 12 }}
                    >
                      <Select
                        placeholder={`Select ${prop.displayName || prop.name}`}
                        allowClear
                        showSearch
                        loading={propsLoading}
                        value={propertyValues[prop.propertyId]?.valueIds?.[0] || undefined}
                        onChange={(val, option) => handlePropertyChange(prop.propertyId, val, option)}
                        filterOption={(input, option) =>
                          (option?.children || '').toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {prop.possibleValues.map(v => (
                          <Select.Option key={v.valueId} value={v.valueId}>
                            {v.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </div>
          )}
          {propsLoading && (
            <Text type="secondary" style={{ fontSize: 12 }}>Loading category attributes...</Text>
          )}

          <Form.Item
            name="materials"
            label={<span>Materials <Text type="secondary" style={{ fontSize: 12 }}>(optional)</Text></span>}
          >
            <Select
              mode="tags"
              placeholder="e.g. Cotton, Polyester, Wood"
              tokenSeparators={[',']}
              style={{ width: '100%' }}
              maxCount={13}
            />
          </Form.Item>

          {/* Existing images preview */}
          {existingImages.length > 0 && (
            <div style={{
              background: cardBg, borderRadius: radii.sm, padding: 12,
              border: `1px solid ${borderColor}`, marginTop: 8,
            }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                <PictureOutlined style={{ marginRight: 6, color: BRAND }} />
                Current Photos ({existingImages.length})
              </Text>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {existingImages.map((img, i) => (
                  <Image
                    key={i}
                    src={img.url_75x75 || img.url_170x135 || img.url}
                    alt={`Photo ${i + 1}`}
                    width={60}
                    height={60}
                    style={{ borderRadius: 6, objectFit: 'cover' }}
                    preview={{ src: img.url_570xN || img.url_fullxfull || img.url }}
                  />
                ))}
              </div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
                To add or remove photos, manage them directly on Etsy
              </Text>
            </div>
          )}
        </>
      ),
    },
    {
      title: 'Pricing & Shipping',
      content: (
        <>
          {listingData?.isDigital && (
            <div style={{
              background: cardBg, borderRadius: radii.sm, padding: 12,
              border: `1px solid ${borderColor}`, marginBottom: 16,
            }}>
              <Tag color="blue">Digital Product</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Buyers receive downloadable files
              </Text>
            </div>
          )}

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="price" label="Price ($)"
                rules={[
                  { required: true, message: 'Price is required' },
                  { type: 'number', min: 0.20, message: 'Minimum price is $0.20' },
                ]}
              >
                <InputNumber
                  prefix={<DollarOutlined />}
                  style={{ width: '100%' }}
                  size="large"
                  min={0.20} step={0.01}
                  precision={2}
                  placeholder="5.00"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="quantity" label="Quantity"
                rules={[{ required: true, message: 'Quantity is required' }]}
              >
                <InputNumber style={{ width: '100%' }} size="large" min={1} max={999} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="whoMade" label="Who made it?"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select options={WHO_MADE_OPTIONS} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="whenMade" label="When was it made?"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select options={WHEN_MADE_OPTIONS} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="isSupply"
            label="What is it?"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value={false}>
                  <div>
                    <Text strong>A finished product</Text><br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Ready to use or display</Text>
                  </div>
                </Radio>
                <Radio value={true}>
                  <div>
                    <Text strong>A supply or tool to make things</Text><br />
                    <Text type="secondary" style={{ fontSize: 12 }}>Used to create other products</Text>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          {!listingData?.isDigital && (
            <Form.Item
              name="shippingProfileId" label="Shipping Profile"
              rules={[{ required: true, message: 'Physical products need a shipping profile' }]}
            >
              <Select
                placeholder="Select a shipping profile"
                size="large"
                loading={shippingLoading}
                notFoundContent={
                  shippingLoading ? 'Loading...' :
                    <div style={{ padding: 12, textAlign: 'center' }}>
                      <Text type="secondary">No shipping profiles found.</Text><br />
                      <a href="https://www.etsy.com/your/shops/me/tools/shipping-profiles" target="_blank" rel="noopener noreferrer">
                        Create one on Etsy →
                      </a>
                    </div>
                }
              >
                {shippingProfiles.map(p => (
                  <Select.Option key={p.shippingProfileId} value={p.shippingProfileId}>
                    {p.title} {p.originCountryIso && <Tag style={{ marginLeft: 8 }}>{p.originCountryIso}</Tag>}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Divider style={{ margin: '16px 0' }} />

          <Form.Item name="personalizationIsRequired" valuePropName="checked" style={{ marginBottom: 4 }}>
            <Switch checkedChildren="Personalization Required" unCheckedChildren="No Personalization" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.personalizationIsRequired !== cur.personalizationIsRequired}>
            {({ getFieldValue }) =>
              getFieldValue('personalizationIsRequired') ? (
                <>
                  <Form.Item name="personalizationInstructions" label="Personalization Instructions">
                    <TextArea placeholder="Tell buyers what info you need..." rows={2} maxLength={256} showCount />
                  </Form.Item>
                  <Form.Item name="personalizationCharCountMax" label="Max Character Count (optional)">
                    <InputNumber style={{ width: '100%' }} min={1} max={1000} placeholder="e.g. 50" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EditOutlined style={{ color: BRAND }} />
          <span>Edit Listing</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      width={720}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {step > 0 && (
              <Button onClick={prevStep} disabled={loading}>
                Back
              </Button>
            )}
          </div>
          <Space>
            <Button onClick={handleClose} disabled={loading}>Cancel</Button>
            {step < steps.length - 1 ? (
              <Button type="primary" onClick={nextStep} style={{ background: BRAND, borderColor: BRAND }}>
                Next
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                style={{ background: BRAND, borderColor: BRAND }}
              >
                {loading ? 'Updating...' : 'Update Listing'}
              </Button>
            )}
          </Space>
        </div>
      }
    >
      {fetching ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading listing details...</Text>
          </div>
        </div>
      ) : (
        <>
          <Steps
            current={step}
            size="small"
            style={{ marginBottom: 24 }}
            items={steps.map(s => ({ title: s.title }))}
          />

          <Form
            form={form}
            layout="vertical"
            requiredMark="optional"
          >
            {steps[step].content}
          </Form>
        </>
      )}
    </Modal>
  );
};

export default EditListingModal;
