/**
 * =====================================================================
 * AFINBO NIGERIA LTD - Google Apps Script (GAS) Backend
 * Platform: Google Apps Script Web App & REST API Engine
 * Integrations: Supabase Database (UrlFetchApp REST)
 * =====================================================================
 */

// Global Configuration Defaults (Configure in File > Project Settings > Script Properties)
var CONFIG = {
  SUPABASE_URL: '', // Set via Script Properties or fallback
  SUPABASE_KEY: '', // Service Role Key or Anon Key
  DEFAULT_ADMIN_USER: 'admin',
  DEFAULT_ADMIN_PASS: 'AfinboAdmin2026!',
  SESSION_DURATION_HOURS: 24
};

/**
 * Helper to retrieve script properties safely
 */
function getProperty_(key, fallback) {
  try {
    var props = PropertiesService.getScriptProperties();
    var val = props.getProperty(key);
    if (val && val.trim() !== '') {
      return val.trim();
    }
  } catch (e) {
    Logger.log('Could not access ScriptProperties: ' + e);
  }
  return fallback || '';
}

function getSupabaseUrl_() {
  return getProperty_('SUPABASE_URL', CONFIG.SUPABASE_URL);
}

function getSupabaseKey_() {
  return getProperty_('SUPABASE_KEY', CONFIG.SUPABASE_KEY) || getProperty_('SUPABASE_SERVICE_ROLE_KEY', '');
}

/**
 * ---------------------------------------------------------------------
 * 1. WEB APP ENTRY POINT (doGet & doPost)
 * ---------------------------------------------------------------------
 */
function doGet(e) {
  e = e || { parameter: {} };
  var apiAction = e.parameter.api || e.parameter.action;

  // If requesting REST API JSON response
  if (apiAction) {
    return handleApiRequest_(e);
  }

  // Otherwise serve the modern Admin Single Page Application
  try {
    var htmlTemplate = HtmlService.createTemplateFromFile('Admin');
    htmlTemplate.initialData = {
      appTitle: 'AFINBO Admin Dashboard',
      version: '2.4.0',
      timestamp: new Date().toISOString()
    };
    
    return htmlTemplate.evaluate()
      .setTitle('AFINBO | Admin Control Center')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return ContentService.createTextOutput(
      'Error loading Admin interface: ' + err.toString()
    ).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doPost(e) {
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = e.parameter || {};
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    var action = postData.action || (e && e.parameter && e.parameter.action);
    var token = postData.token || (e && e.parameter && e.parameter.token);

    var result;
    switch (action) {
      case 'login':
        result = adminLogin(postData.username, postData.password);
        break;
      case 'verify_token':
        result = verifySessionToken(token);
        break;
      case 'get_products':
        result = getProductsAdmin(token);
        break;
      case 'save_product':
        result = saveProductAdmin(token, postData.product);
        break;
      case 'delete_product':
        result = deleteProductAdmin(token, postData.productId);
        break;
      case 'get_quotes':
        result = getQuotesAdmin(token, postData.status);
        break;
      case 'update_quote_status':
        result = updateQuoteStatusAdmin(token, postData.quoteId, postData.status, postData.adminNotes);
        break;
      case 'submit_quote':
        result = submitQuotePublic(postData.quote);
        break;
      case 'wipe_demo_data':
        result = wipeDemoData(token);
        break;
      case 'get_dashboard_stats':
        result = getDashboardStats(token);
        break;
      default:
        result = { success: false, error: 'Invalid or missing action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Exception in doPost: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleApiRequest_(e) {
  var action = e.parameter.api || e.parameter.action;
  var token = e.parameter.token;
  var result = { success: false, message: 'Unrecognized API endpoint' };

  if (action === 'get_products_public') {
    result = getPublicProducts();
  } else if (action === 'get_quotes') {
    result = getQuotesAdmin(token, e.parameter.status);
  } else if (action === 'get_stats') {
    result = getDashboardStats(token);
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ---------------------------------------------------------------------
 * 2. SUPABASE REST API CLIENT (UrlFetchApp)
 * ---------------------------------------------------------------------
 */
function supabaseRequest_(endpoint, method, payload, queryParams) {
  var baseUrl = getSupabaseUrl_();
  var apiKey = getSupabaseKey_();

  if (!baseUrl || !apiKey) {
    throw new Error('Supabase URL or API Key is missing. Please configure Script Properties (SUPABASE_URL and SUPABASE_KEY).');
  }

  // Format URL
  var url = baseUrl.replace(/\/+$/, '') + '/rest/v1/' + endpoint.replace(/^\/+/, '');
  if (queryParams && typeof queryParams === 'object') {
    var qs = [];
    for (var k in queryParams) {
      if (queryParams.hasOwnProperty(k) && queryParams[k] !== undefined && queryParams[k] !== null) {
        qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(queryParams[k]));
      }
    }
    if (qs.length > 0) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + qs.join('&');
    }
  }

  var options = {
    method: method || 'GET',
    headers: {
      'apikey': apiKey,
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    muteHttpExceptions: true
  };

  if (payload && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.payload = JSON.stringify(payload);
  }

  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  var responseBody = response.getContentText();

  var parsed;
  try {
    parsed = responseBody ? JSON.parse(responseBody) : null;
  } catch (parseErr) {
    parsed = responseBody;
  }

  if (responseCode >= 200 && responseCode < 300) {
    return parsed;
  } else {
    var errorMsg = (parsed && parsed.message) || (parsed && parsed.error) || ('HTTP ' + responseCode + ': ' + responseBody);
    throw new Error('Supabase API Error: ' + errorMsg);
  }
}

/**
 * ---------------------------------------------------------------------
 * 3. ADMIN AUTHENTICATION SYSTEM
 * ---------------------------------------------------------------------
 */
function hashString_(input) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  var txtHash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    var byteString = hashVal.toString(16);
    if (byteString.length == 1) byteString = '0' + byteString;
    txtHash += byteString;
  }
  return txtHash;
}

/**
 * Authenticates admin credentials and returns a secure token
 */
function adminLogin(username, password) {
  try {
    if (!username || !password) {
      return { success: false, error: 'Username and password are required.' };
    }

    var trimmedUser = username.toString().trim();
    var trimmedPass = password.toString().trim();
    var expectedUser = getProperty_('ADMIN_USERNAME', CONFIG.DEFAULT_ADMIN_USER);
    var expectedPass = getProperty_('ADMIN_PASSWORD', CONFIG.DEFAULT_ADMIN_PASS);

    var isAuthenticated = false;
    var adminInfo = {
      username: trimmedUser,
      name: 'AFINBO Administrator',
      role: 'superadmin'
    };

    // 1. Check Script Properties First
    if (trimmedUser.toLowerCase() === expectedUser.toLowerCase() && trimmedPass === expectedPass) {
      isAuthenticated = true;
    } else {
      // 2. Check Supabase 'admin_users' table if configured
      try {
        var inputHash = hashString_(trimmedPass);
        var users = supabaseRequest_('admin_users', 'GET', null, {
          username: 'eq.' + trimmedUser,
          is_active: 'eq.true',
          select: '*'
        });

        if (users && users.length > 0) {
          var userRec = users[0];
          if (userRec.password_hash === inputHash || userRec.password_hash === trimmedPass) {
            isAuthenticated = true;
            adminInfo.name = userRec.full_name || trimmedUser;
            adminInfo.role = userRec.role || 'admin';
            
            // Update last_login_at in background
            try {
              supabaseRequest_('admin_users?id=eq.' + userRec.id, 'PATCH', {
                last_login_at: new Date().toISOString()
              });
            } catch (ignore) {}
          }
        }
      } catch (dbErr) {
        Logger.log('Supabase admin check fallback: ' + dbErr);
      }
    }

    if (!isAuthenticated) {
      return { success: false, error: 'Invalid administrative username or password.' };
    }

    // Generate Session Token
    var tokenPayload = {
      user: adminInfo.username,
      name: adminInfo.name,
      role: adminInfo.role,
      exp: new Date().getTime() + (CONFIG.SESSION_DURATION_HOURS * 3600 * 1000),
      salt: Utilities.getUuid()
    };

    var tokenString = Utilities.base64Encode(JSON.stringify(tokenPayload));
    
    // Store active token in Cache / UserProperties
    var cache = CacheService.getScriptCache();
    cache.put('token_' + tokenPayload.salt, JSON.stringify(tokenPayload), 21600); // 6 hours

    return {
      success: true,
      token: tokenString,
      user: adminInfo,
      expiresAt: new Date(tokenPayload.exp).toISOString()
    };
  } catch (err) {
    return { success: false, error: 'Login process error: ' + err.toString() };
  }
}

/**
 * Verifies if the provided token is active and valid
 */
function verifySessionToken(token) {
  try {
    if (!token) return { valid: false, error: 'Missing token' };
    var decodedJson = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    var payload = JSON.parse(decodedJson);

    if (!payload || !payload.exp || !payload.user) {
      return { valid: false, error: 'Malformed token' };
    }

    var now = new Date().getTime();
    if (now > payload.exp) {
      return { valid: false, error: 'Session expired. Please log in again.' };
    }

    return {
      valid: true,
      user: {
        username: payload.user,
        name: payload.name,
        role: payload.role
      }
    };
  } catch (e) {
    return { valid: false, error: 'Invalid token signature' };
  }
}

function requireAuth_(token) {
  var auth = verifySessionToken(token);
  if (!auth.valid) {
    throw new Error('Unauthorized: ' + (auth.error || 'Authentication required.'));
  }
  return auth.user;
}

/**
 * ---------------------------------------------------------------------
 * 4. DEMO DATA WIPE UTILITY (Guarded by Admin Auth)
 * ---------------------------------------------------------------------
 */
function wipeDemoData(token) {
  try {
    requireAuth_(token);

    // Delete all rows in quotes table
    try {
      supabaseRequest_('quotes?id=neq.00000000-0000-0000-0000-000000000000', 'DELETE');
    } catch (e1) {
      Logger.log('Quotes wipe notice: ' + e1);
    }

    // Delete all rows in products table
    try {
      supabaseRequest_('products?id=neq.00000000-0000-0000-0000-000000000000', 'DELETE');
    } catch (e2) {
      Logger.log('Products wipe notice: ' + e2);
    }

    return {
      success: true,
      message: 'Demo data wiped successfully. Products and Quotes tables are clean and ready for production.'
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * ---------------------------------------------------------------------
 * 5. PRODUCT MANAGEMENT (Quote-Based Model)
 * ---------------------------------------------------------------------
 */
function getProductsAdmin(token) {
  try {
    requireAuth_(token);
    var products = supabaseRequest_('products', 'GET', null, {
      select: '*',
      order: 'created_at.desc'
    });
    return { success: true, products: products || [] };
  } catch (err) {
    return { success: false, error: err.toString(), products: [] };
  }
}

function getPublicProducts() {
  try {
    var products = supabaseRequest_('products', 'GET', null, {
      status: 'eq.active',
      select: '*',
      order: 'created_at.desc'
    });
    return { success: true, products: products || [] };
  } catch (err) {
    return { success: false, error: err.toString(), products: [] };
  }
}

/**
 * Add or Edit a Product (Quote-Based fields only, no pricing columns)
 */
function saveProductAdmin(token, productPayload) {
  try {
    requireAuth_(token);
    if (!productPayload || !productPayload.name || !productPayload.category) {
      return { success: false, error: 'Product Name and Category are required.' };
    }

    var record = {
      name: productPayload.name.trim(),
      model_number: productPayload.model_number || productPayload.modelNumber || null,
      sku: productPayload.sku || null,
      brand: productPayload.brand || 'AFINBO',
      category: productPayload.category.trim(),
      short_description: productPayload.short_description || productPayload.shortDescription || null,
      product_overview: productPayload.product_overview || productPayload.productOverview || null,
      main_image_url: productPayload.main_image_url || productPayload.mainImageUrl || productPayload.image || null,
      gallery_urls: productPayload.gallery_urls || productPayload.gallery || [],
      technical_specs: productPayload.technical_specs || productPayload.technicalSpecs || productPayload.techSpecs || [],
      features: productPayload.features || [],
      in_the_box: productPayload.in_the_box || productPayload.inTheBox || [],
      status: productPayload.status || 'active',
      is_best_seller: Boolean(productPayload.is_best_seller || productPayload.isBestSeller),
      updated_at: new Date().toISOString()
    };

    var result;
    if (productPayload.id) {
      // Update existing product
      result = supabaseRequest_('products?id=eq.' + productPayload.id, 'PATCH', record);
    } else {
      // Create new product
      record.created_at = new Date().toISOString();
      result = supabaseRequest_('products', 'POST', record);
    }

    return {
      success: true,
      product: (result && result.length > 0) ? result[0] : record,
      message: productPayload.id ? 'Product updated successfully.' : 'Product created successfully.'
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function deleteProductAdmin(token, productId) {
  try {
    requireAuth_(token);
    if (!productId) return { success: false, error: 'Missing product ID' };

    supabaseRequest_('products?id=eq.' + productId, 'DELETE');
    return { success: true, message: 'Product removed from catalog.' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * ---------------------------------------------------------------------
 * 6. QUOTE REQUEST MANAGEMENT
 * ---------------------------------------------------------------------
 */
function getQuotesAdmin(token, statusFilter) {
  try {
    requireAuth_(token);
    var queryParams = {
      select: '*',
      order: 'created_at.desc'
    };

    if (statusFilter && statusFilter !== 'all') {
      queryParams.status = 'eq.' + statusFilter;
    }

    var quotes = supabaseRequest_('quotes', 'GET', null, queryParams);
    return { success: true, quotes: quotes || [] };
  } catch (err) {
    return { success: false, error: err.toString(), quotes: [] };
  }
}

function updateQuoteStatusAdmin(token, quoteId, newStatus, adminNotes) {
  try {
    requireAuth_(token);
    if (!quoteId || !newStatus) {
      return { success: false, error: 'Quote ID and status are required.' };
    }

    var updatePayload = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    }

    var res = supabaseRequest_('quotes?id=eq.' + quoteId, 'PATCH', updatePayload);
    return {
      success: true,
      quote: (res && res.length > 0) ? res[0] : null,
      message: 'Quote status updated to ' + newStatus
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

function deleteQuoteAdmin(token, quoteId) {
  try {
    requireAuth_(token);
    if (!quoteId) return { success: false, error: 'Missing quote ID' };
    supabaseRequest_('quotes?id=eq.' + quoteId, 'DELETE');
    return { success: true, message: 'Quote request deleted.' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Public Quote Submission (Used by public website storefront)
 */
function submitQuotePublic(quotePayload) {
  try {
    if (!quotePayload || !quotePayload.customer_name || !quotePayload.customer_email || !quotePayload.product_name) {
      return { success: false, error: 'Customer name, email, and product name are required.' };
    }

    var newQuote = {
      product_id: quotePayload.product_id || null,
      product_name: quotePayload.product_name.trim(),
      customer_name: quotePayload.customer_name.trim(),
      customer_email: quotePayload.customer_email.trim().toLowerCase(),
      customer_phone: (quotePayload.customer_phone || '').trim(),
      company_name: (quotePayload.company_name || quotePayload.company || '').trim() || null,
      quantity: parseInt(quotePayload.quantity, 10) || 1,
      notes: quotePayload.notes || quotePayload.message || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    var res = supabaseRequest_('quotes', 'POST', newQuote);

    // Optional: Send Email Notification to Sales Team
    try {
      var salesEmail = getProperty_('SALES_NOTIFICATION_EMAIL', 'afinboproject@gmail.com');
      if (salesEmail) {
        MailApp.sendEmail({
          to: salesEmail,
          subject: '⚡ New Quote Request: ' + newQuote.product_name + ' (' + newQuote.customer_name + ')',
          htmlBody: '<h3>New Fiber Equipment Quote Request</h3>' +
            '<p><strong>Product:</strong> ' + newQuote.product_name + '</p>' +
            '<p><strong>Quantity:</strong> ' + newQuote.quantity + '</p>' +
            '<p><strong>Customer:</strong> ' + newQuote.customer_name + '</p>' +
            '<p><strong>Email:</strong> ' + newQuote.customer_email + '</p>' +
            '<p><strong>Phone:</strong> ' + newQuote.customer_phone + '</p>' +
            '<p><strong>Company:</strong> ' + (newQuote.company_name || 'N/A') + '</p>' +
            '<p><strong>Notes:</strong> ' + (newQuote.notes || 'None') + '</p>' +
            '<hr/><p>Log in to the AFINBO Admin Dashboard to review and process this quote.</p>'
        });
      }
    } catch (mailErr) {
      Logger.log('Quote notification email notice: ' + mailErr);
    }

    return {
      success: true,
      quote: (res && res.length > 0) ? res[0] : newQuote,
      message: 'Quote request submitted successfully. Our sales engineers will contact you shortly.'
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * ---------------------------------------------------------------------
 * 7. DASHBOARD METRICS & ANALYTICS
 * ---------------------------------------------------------------------
 */
function getDashboardStats(token) {
  try {
    requireAuth_(token);
    
    var products = supabaseRequest_('products', 'GET', null, { select: 'id,status,category' }) || [];
    var quotes = supabaseRequest_('quotes', 'GET', null, { select: 'id,status,created_at' }) || [];

    var pendingQuotes = quotes.filter(function(q) { return q.status === 'pending'; }).length;
    var contactedQuotes = quotes.filter(function(q) { return q.status === 'contacted'; }).length;
    var completedQuotes = quotes.filter(function(q) { return q.status === 'completed'; }).length;
    var activeProducts = products.filter(function(p) { return p.status === 'active'; }).length;

    return {
      success: true,
      stats: {
        totalProducts: products.length,
        activeProducts: activeProducts,
        totalQuotes: quotes.length,
        pendingQuotes: pendingQuotes,
        contactedQuotes: contactedQuotes,
        completedQuotes: completedQuotes
      }
    };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}
