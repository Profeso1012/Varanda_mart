const { sql } = require('../../config/database');

// ─── Customers ────────────────────────────────────────────────────────────────

const findCustomerByEmail = async (email) => {
  const [c] = await sql`SELECT * FROM customers WHERE email = ${email.toLowerCase()} AND deleted_at IS NULL`;
  return c || null;
};

const findCustomerById = async (id) => {
  const [c] = await sql`SELECT * FROM customers WHERE id = ${id} AND deleted_at IS NULL`;
  return c || null;
};

const createCustomer = async ({ email, firstName, lastName, phone }) => {
  const [c] = await sql`
    INSERT INTO customers (email, first_name, last_name, phone)
    VALUES (${email.toLowerCase()}, ${firstName || null}, ${lastName || null}, ${phone || null})
    RETURNING *
  `;
  return c;
};

const updateCustomer = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [c] = await sql`
    UPDATE customers SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return c;
};

const updateCustomerLastLogin = async (id) => {
  await sql`UPDATE customers SET last_login_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
};

// ─── Customer addresses ───────────────────────────────────────────────────────

const listCustomerAddresses = async (customerId) => {
  return sql`
    SELECT * FROM customer_addresses
    WHERE customer_id = ${customerId}
    ORDER BY is_default DESC, created_at ASC
  `;
};

const findCustomerAddressById = async (id, customerId) => {
  const [a] = await sql`
    SELECT * FROM customer_addresses WHERE id = ${id} AND customer_id = ${customerId}
  `;
  return a || null;
};

const createCustomerAddress = async (customerId, data) => {
  // If this is the first address or marked default, unset others
  if (data.isDefault) {
    await sql`UPDATE customer_addresses SET is_default = false WHERE customer_id = ${customerId}`;
  }
  const [a] = await sql`
    INSERT INTO customer_addresses (
      customer_id, label, recipient_name, phone,
      street_line1, street_line2, city, state, country, postal_code, is_default
    ) VALUES (
      ${customerId}, ${data.label || null}, ${data.recipientName || null}, ${data.phone || null},
      ${data.streetLine1}, ${data.streetLine2 || null}, ${data.city}, ${data.state},
      ${data.country || 'Nigeria'}, ${data.postalCode || null}, ${data.isDefault ?? false}
    )
    RETURNING *
  `;
  return a;
};

const updateCustomerAddress = async (id, customerId, data) => {
  if (data.isDefault) {
    await sql`UPDATE customer_addresses SET is_default = false WHERE customer_id = ${customerId}`;
  }
  const fieldMap = {
    label: data.label, recipientName: data.recipientName, phone: data.phone,
    streetLine1: data.streetLine1, streetLine2: data.streetLine2,
    city: data.city, state: data.state, country: data.country,
    postalCode: data.postalCode, isDefault: data.isDefault,
  };
  const dbFields = {};
  if (fieldMap.label !== undefined) dbFields.label = fieldMap.label;
  if (fieldMap.recipientName !== undefined) dbFields.recipient_name = fieldMap.recipientName;
  if (fieldMap.phone !== undefined) dbFields.phone = fieldMap.phone;
  if (fieldMap.streetLine1 !== undefined) dbFields.street_line1 = fieldMap.streetLine1;
  if (fieldMap.streetLine2 !== undefined) dbFields.street_line2 = fieldMap.streetLine2;
  if (fieldMap.city !== undefined) dbFields.city = fieldMap.city;
  if (fieldMap.state !== undefined) dbFields.state = fieldMap.state;
  if (fieldMap.country !== undefined) dbFields.country = fieldMap.country;
  if (fieldMap.postalCode !== undefined) dbFields.postal_code = fieldMap.postalCode;
  if (fieldMap.isDefault !== undefined) dbFields.is_default = fieldMap.isDefault;

  const keys = Object.keys(dbFields);
  if (!keys.length) return null;
  const [a] = await sql`
    UPDATE customer_addresses SET ${sql(dbFields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND customer_id = ${customerId}
    RETURNING *
  `;
  return a;
};

const deleteCustomerAddress = async (id, customerId) => {
  await sql`DELETE FROM customer_addresses WHERE id = ${id} AND customer_id = ${customerId}`;
};

module.exports = {
  findCustomerByEmail,
  findCustomerById,
  createCustomer,
  updateCustomer,
  updateCustomerLastLogin,
  listCustomerAddresses,
  findCustomerAddressById,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
};
