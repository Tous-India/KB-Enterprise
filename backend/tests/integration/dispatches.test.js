import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../../app.js';
import config from '../../src/config/index.js';
import User from '../../src/modules/users/users.model.js';
import Dispatch from '../../src/modules/dispatches/dispatches.model.js';
import Order from '../../src/modules/orders/orders.model.js';
import ProformaInvoice from '../../src/modules/proformaInvoices/proformaInvoices.model.js';
import Product from '../../src/modules/products/products.model.js';
import { validAdmin, validBuyer } from '../fixtures/users.fixture.js';
import { validProduct } from '../fixtures/products.fixture.js';

// Generate JWT token for authenticated requests
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
};

describe('Dispatches API Integration Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let buyerToken;
  let testProduct;
  let testOrder;
  let testDispatch;

  beforeEach(async () => {
    // Create admin user
    adminUser = await User.create({
      ...validAdmin,
      user_id: 'ADM-TEST-001',
    });
    adminToken = generateToken(adminUser);

    // Create buyer user
    buyerUser = await User.create({
      ...validBuyer,
      user_id: 'BUY-TEST-001',
    });
    buyerToken = generateToken(buyerUser);

    // Create test product
    testProduct = await Product.create({
      ...validProduct,
      product_id: 'PRD-TEST-001',
    });

    // Create test order
    testOrder = await Order.create({
      title: 'Test Order',
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      status: 'OPEN',
      items: [
        {
          product: testProduct._id,
          product_id: testProduct.product_id,
          part_number: testProduct.part_number,
          product_name: testProduct.product_name,
          quantity: 10,
          unit_price: 100,
          total_price: 1000,
        },
      ],
      subtotal: 1000,
      total_amount: 1000,
    });

    // Create test dispatch (model doesn't have status field)
    testDispatch = await Dispatch.create({
      buyer: buyerUser._id,
      buyer_name: buyerUser.name,
      source_type: 'ORDER',
      source_type_ref: 'Order',
      source_id: testOrder._id,
      source_number: testOrder.order_id,
      items: [
        {
          part_number: testProduct.part_number,
          product_name: testProduct.product_name,
          quantity: 5,
          unit_price: 100,
          total_price: 500,
        },
      ],
      total_quantity: 5,
      total_amount: 500,
      shipping_info: {
        awb_number: 'FX123456',
        shipping_by: 'FedEx',
      },
    });
  });

  describe('GET /api/dispatches', () => {
    it('should fetch all dispatches (admin)', async () => {
      const res = await request(app)
        .get('/api/dispatches')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter dispatches by source_type', async () => {
      const res = await request(app)
        .get('/api/dispatches?source_type=ORDER')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every(d => d.source_type === 'ORDER')).toBe(true);
    });

    it('should reject buyer requests', async () => {
      const res = await request(app)
        .get('/api/dispatches')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/dispatches/my', () => {
    it('should fetch buyer own dispatches', async () => {
      const res = await request(app)
        .get('/api/dispatches/my')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/dispatches/:id', () => {
    it('should fetch dispatch by ID (admin)', async () => {
      const res = await request(app)
        .get(`/api/dispatches/${testDispatch._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.dispatch.dispatch_id).toBe(testDispatch.dispatch_id);
    });

    it('should return 404 for non-existent dispatch', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/dispatches/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/dispatches', () => {
    it('should create dispatch (admin)', async () => {
      // Create a new order for this test to avoid dispatch quantity conflict
      const newOrder = await Order.create({
        title: 'New Test Order',
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        status: 'OPEN',
        items: [
          {
            product: testProduct._id,
            product_id: testProduct.product_id,
            part_number: testProduct.part_number,
            product_name: testProduct.product_name,
            quantity: 10,
            unit_price: 100,
            total_price: 1000,
          },
        ],
        subtotal: 1000,
        total_amount: 1000,
      });

      const res = await request(app)
        .post('/api/dispatches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          source_type: 'ORDER',
          source_id: newOrder._id,
          items: [
            {
              product_id: testProduct.product_id,
              part_number: testProduct.part_number,
              product_name: testProduct.product_name,
              quantity: 3,
              unit_price: 100,
            },
          ],
          shipping_info: {
            shipping_by: 'DHL',
            awb_number: 'DHL789',
          },
        });

      // Controller uses ApiResponse.success, which returns 200
      expect(res.status).toBe(200);
      expect(res.body.data.dispatch.dispatch_id).toBeDefined();
    });
  });

  describe('DELETE /api/dispatches/:id', () => {
    it('should delete dispatch (admin)', async () => {
      const res = await request(app)
        .delete(`/api/dispatches/${testDispatch._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify dispatch is deleted
      const deletedDispatch = await Dispatch.findById(testDispatch._id);
      expect(deletedDispatch).toBeNull();
    });
  });

  describe('GET /api/dispatches/summary/:sourceType/:sourceId', () => {
    it('should fetch dispatch summary for source (admin)', async () => {
      const res = await request(app)
        .get(`/api/dispatches/summary/ORDER/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe('GET /api/dispatches/by-source/:sourceType/:sourceId', () => {
    it('should fetch dispatches by source (admin)', async () => {
      const res = await request(app)
        .get(`/api/dispatches/by-source/ORDER/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.dispatches).toBeDefined();
      expect(Array.isArray(res.body.data.dispatches)).toBe(true);
    });
  });

  describe('Dispatch Data Integrity', () => {
    it('should auto-generate dispatch_id on create', async () => {
      const dispatch = await Dispatch.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        source_type: 'ORDER',
        source_type_ref: 'Order',
        source_id: testOrder._id,
        items: [],
        total_amount: 0,
      });

      expect(dispatch.dispatch_id).toBeDefined();
      expect(dispatch.dispatch_id).toMatch(/^DSP-/);
    });

    it('should default dispatch_type to STANDARD', async () => {
      const dispatch = await Dispatch.create({
        buyer: buyerUser._id,
        buyer_name: buyerUser.name,
        source_type: 'ORDER',
        source_type_ref: 'Order',
        source_id: testOrder._id,
        items: [],
        total_amount: 0,
      });

      expect(dispatch.dispatch_type).toBe('STANDARD');
    });
  });
});
