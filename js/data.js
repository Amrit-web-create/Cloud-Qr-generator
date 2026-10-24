/*!
 * QR Generator — data: palettes, templates, icons, content builders
 */
(function (root) {
  'use strict';
  var QRO = root.QRO = root.QRO || {};

  /* ============================== 60 colour combinations ============================== */
  // [name, foreground-1, foreground-2 (gradient end, same = solid), background]
  var P = [
    ['Plum Cream', '#3E3239', '#3E3239', '#F7EFE7'],
    ['Mauve Silk', '#4A3640', '#8A5A6B', '#F7EFE7'],
    ['Rose Wine', '#5B2A3A', '#A64B63', '#FBEFEA'],
    ['Sand Ink', '#2B2326', '#2B2326', '#E8D2C4'],
    ['Cocoa Latte', '#4B2E24', '#8A5A44', '#F4E6DA'],
    ['Midnight Navy', '#0F1B3D', '#2B4A9E', '#EEF2FF'],
    ['Ocean Deep', '#062A4A', '#0A7EA4', '#E8F6FB'],
    ['Emerald Depth', '#064E3B', '#059669', '#ECFDF5'],
    ['Forest Mint', '#14532D', '#16A34A', '#F0FDF4'],
    ['Sunset', '#7C2D12', '#EA580C', '#FFF7ED'],
    ['Berry Pop', '#701A75', '#DB2777', '#FDF2F8'],
    ['Royal Violet', '#2E1065', '#7C3AED', '#F5F3FF'],
    ['Electric Indigo', '#1E1B4B', '#4F46E5', '#EEF2FF'],
    ['Crimson', '#7F1D1D', '#DC2626', '#FEF2F2'],
    ['Teal Fresh', '#134E4A', '#0D9488', '#F0FDFA'],
    ['Gold Noir', '#1C1917', '#B45309', '#FEF3C7'],
    ['Lavender Haze', '#4C1D95', '#9333EA', '#FAF5FF'],
    ['Coral Reef', '#9A3412', '#F43F5E', '#FFF1F2'],
    ['Slate Pro', '#0F172A', '#334155', '#F1F5F9'],
    ['Graphite', '#18181B', '#52525B', '#FAFAFA'],
    ['Pure Black', '#000000', '#000000', '#FFFFFF'],
    ['Classic Blue', '#1D4ED8', '#1D4ED8', '#FFFFFF'],
    ['Sky Gradient', '#0369A1', '#6366F1', '#F0F9FF'],
    ['Peach Fizz', '#9F1239', '#EA580C', '#FFF7ED'],
    ['Mint Chip', '#065F46', '#0891B2', '#ECFEFF'],
    ['Grape Soda', '#581C87', '#C026D3', '#FDF4FF'],
    ['Honey', '#78350F', '#D97706', '#FFFBEB'],
    ['Rosewood', '#4C0519', '#9F1239', '#FFF1F2'],
    ['Arctic', '#0C4A6E', '#0E7490', '#F0FDFF'],
    ['Olive Grove', '#365314', '#65A30D', '#F7FEE7'],
    ['Noir Rose', '#E8D2C4', '#C7A9A3', '#2A2126'],
    ['Midnight Cyan', '#22D3EE', '#818CF8', '#0B1020'],
    ['Neon Mint', '#34D399', '#22D3EE', '#04130E'],
    ['Hot Pink Night', '#F472B6', '#FB7185', '#1A0A14'],
    ['Gold Night', '#FCD34D', '#F59E0B', '#14110A'],
    ['Violet Glow', '#C4B5FD', '#F0ABFC', '#150B2E'],
    ['Ice', '#E0F2FE', '#7DD3FC', '#0B1B2B'],
    ['Lime Volt', '#BEF264', '#4ADE80', '#0A1405'],
    ['Sunset Night', '#FDBA74', '#FB7185', '#1B0F0A'],
    ['White on Black', '#FFFFFF', '#FFFFFF', '#000000'],
    ['Insta Glow', '#7C3AED', '#DB2777', '#FFFFFF'],
    ['Aurora', '#0284C7', '#7C3AED', '#FFFFFF'],
    ['Fire', '#B91C1C', '#EA580C', '#FFFFFF'],
    ['Matcha', '#166534', '#4D7C0F', '#FFFFFF'],
    ['Blueberry', '#1E3A8A', '#6D28D9', '#FFFFFF'],
    ['Cherry Cola', '#450A0A', '#BE123C', '#FFF5F5'],
    ['Cotton Candy', '#BE185D', '#7C3AED', '#FFF0F7'],
    ['Steel Blue', '#1E293B', '#2563EB', '#F8FAFC'],
    ['Terra', '#7C2D12', '#A16207', '#FEF6E7'],
    ['Dune', '#44403C', '#92400E', '#F5F0E8'],
    ['Plum Neon', '#3E3239', '#DB2777', '#F7EFE7'],
    ['Mono Mauve', '#6B5560', '#6B5560', '#F7EFE7'],
    ['Pistachio', '#3F6212', '#15803D', '#F7FEE7'],
    ['Aqua Marine', '#115E59', '#2563EB', '#F0FDFA'],
    ['Inky Rose', '#1F1418', '#BE185D', '#FDF2F8'],
    ['Copper', '#431407', '#C2410C', '#FFEDD5'],
    ['Sapphire', '#172554', '#0369A1', '#EFF6FF'],
    ['Orchid', '#4A044E', '#A21CAF', '#FDF4FF'],
    ['Burgundy Cream', '#4A0D1F', '#7F1D1D', '#F7EFE7'],
    ['Twilight', '#1E1B4B', '#BE185D', '#F5F3FF']
  ];
  QRO.PALETTES = P.map(function (p, i) { return { id: i, name: p[0], c1: p[1], c2: p[2], bg: p[3], solid: p[1] === p[2] }; });

  /* ============================== shapes lists ============================== */
  QRO.BODY_SHAPES = [
    ['square', 'Square'], ['rounded', 'Rounded'], ['liquid', 'Liquid'], ['classy', 'Classy'],
    ['dots', 'Dots'], ['pearl', 'Pearl'], ['diamond', 'Diamond'], ['bars', 'Bars'],
    ['hbars', 'Lines'], ['heart', 'Heart'], ['sparkle', 'Sparkle']
  ];
  QRO.EYE_FRAMES = [['square', 'Square'], ['rounded', 'Rounded'], ['circle', 'Circle'], ['leaf', 'Leaf'], ['octagon', 'Octagon']];
  QRO.EYE_BALLS = [['square', 'Square'], ['rounded', 'Rounded'], ['circle', 'Circle'], ['diamond', 'Diamond'], ['leaf', 'Leaf'], ['heart', 'Heart'], ['sparkle', 'Sparkle']];

  /* ============================== icons (inline SVG, drawn in-house) ============================== */
  function svg(bg, inner) {
    var fill = bg.indexOf('url') === 0 ? bg : bg;
    var defs = '<defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#F59E0B"/><stop offset=".5" stop-color="#DB2777"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="240" height="240">' + defs +
      '<circle cx="12" cy="12" r="12" fill="' + fill + '"/>' + inner + '</svg>';
  }
  var W = 'fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    website: ['Website', svg('#3E3239', '<g ' + W + '><circle cx="12" cy="12" r="6.6"/><path d="M5.4 12h13.2M12 5.4c2.4 2.2 2.4 11 0 13.2M12 5.4c-2.4 2.2-2.4 11 0 13.2"/></g>')],
    facebook: ['Facebook', svg('#1877F2', '<path fill="#fff" d="M13.2 19.5v-6.3h2.1l.4-2.6h-2.5V9.1c0-.8.3-1.3 1.4-1.3h1.2V5.5c-.2 0-1-.1-1.9-.1-2 0-3.300 1.200-3.300 3.400v1.800H8.500v2.600h2.100v6.300z"/>')],
    whatsapp: ['WhatsApp', svg('#25D366', '<path ' + W + ' d="M12 5.2a6.800 6.800 0 0 0-5.800 10.300L5.200 18.800l3.400-.9A6.800 6.800 0 1 0 12 5.200z"/><path fill="#fff" d="M9.600 8.900c.2-.4.500-.4.700-.4l.6 1.200-.5.800c.4.900 1.200 1.700 2.200 2.200l.8-.5 1.200.6c0 .3-.1.700-.5 1-.7.6-2 .3-3.300-.8-1.300-1-2.200-2.800-1.200-4.100z"/>')],
    instagram: ['Instagram', svg('url(#g)', '<g ' + W + '><rect x="6.200" y="6.200" width="11.600" height="11.600" rx="3.400"/><circle cx="12" cy="12" r="2.700"/></g><circle cx="15.300" cy="8.700" r=".9" fill="#fff"/>')],
    youtube: ['YouTube', svg('#FF0033', '<rect x="5.200" y="7.300" width="13.600" height="9.400" rx="2.600" fill="#fff"/><path d="M10.600 9.800l3.800 2.200-3.800 2.200z" fill="#FF0033"/>')],
    x: ['X', svg('#0A0A0A', '<path ' + W + ' d="M7.200 7.200l9.600 9.600M16.800 7.200l-9.600 9.600"/>')],
    linkedin: ['LinkedIn', svg('#0A66C2', '<g fill="#fff"><rect x="6.800" y="10" width="2.300" height="7.200"/><circle cx="7.950" cy="7.500" r="1.400"/><path d="M10.800 10h2.200v1c.4-.7 1.200-1.200 2.300-1.200 2.100 0 2.700 1.300 2.700 3.300v4.100h-2.300v-3.600c0-.9-.2-1.600-1.100-1.600s-1.500.6-1.500 1.600v3.600h-2.300z"/></g>')],
    telegram: ['Telegram', svg('#229ED9', '<path fill="#fff" d="M17.800 7L6.500 11.400c-.7.300-.7.700-.1.900l2.900.9 1.100 3.400c.1.400.3.500.6.200l1.600-1.500 3 2.200c.5.300.9.100 1-.5L18.700 7.900c.2-.8-.3-1.100-.9-.9zm-1.500 2l-5.400 4.900-.2 2-.9-2.900z"/>')],
    mail: ['Email', svg('#C2410C', '<g ' + W + '><rect x="5.500" y="7.500" width="13" height="9" rx="2"/><path d="M6 8.500l6 4.500 6-4.500"/></g>')],
    phone: ['Phone', svg('#16A34A', '<path fill="#fff" d="M8.300 6.200l1.800.4.8 2.300-1.200.9c.8 1.600 1.900 2.700 3.500 3.500l.9-1.200 2.300.8.4 1.800c0 .7-.5 1.300-1.400 1.500C11.300 15.800 8.200 12.700 7.100 7.600c.2-.8.800-1.400 1.200-1.400z"/>')],
    wifi: ['Wi-Fi', svg('#0D9488', '<g ' + W + '><path d="M6.200 10.300c3.500-3 8.100-3 11.600 0M8.400 13c2.300-1.800 4.900-1.800 7.200 0M10.600 15.700c.9-.6 1.900-.6 2.800 0"/></g><circle cx="12" cy="18" r="1" fill="#fff"/>')],
    pin: ['Location', svg('#DC2626', '<path fill="#fff" d="M12 5.500a4.500 4.500 0 0 0-4.500 4.500c0 3.400 4.500 8.300 4.500 8.300s4.500-4.900 4.500-8.300A4.500 4.500 0 0 0 12 5.500z"/><circle cx="12" cy="10" r="1.700" fill="#DC2626"/>')],
    rupee: ['UPI / Pay', svg('#4F46E5', '<path ' + W + ' d="M8.500 7.500h7M8.500 10.300h7M8.500 7.500c4.500 0 4.500 5.600-.2 5.600l5.200 4.400"/>')],
    heart: ['Heart', svg('#DB2777', '<path fill="#fff" d="M12 17.800c-4.500-3-5.800-5-5.800-7a2.800 2.800 0 0 1 5.100-1.600l.7.900.7-.9a2.800 2.800 0 0 1 5.100 1.600c0 2-1.300 4-5.800 7z"/>')],
    star: ['Star', svg('#F59E0B', '<path fill="#fff" d="M12 6l1.700 3.700 4 .5-3 2.700.8 4-3.500-2-3.500 2 .8-4-3-2.700 4-.5z"/>')],
    bolt: ['Bolt', svg('#7C3AED', '<path fill="#fff" d="M13 5.500l-5 7h3.500l-1 6 5.500-7.500h-3.600z"/>')]
  };
  QRO.ICONS = Object.keys(ICONS).map(function (k) {
    return { id: k, name: ICONS[k][0], src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ICONS[k][1]) };
  });
  QRO.iconById = function (id) {
    for (var i = 0; i < QRO.ICONS.length; i++) if (QRO.ICONS[i].id === id) return QRO.ICONS[i];
    return null;
  };

  /* ============================== 60 templates ============================== */
  // T(name, category, body, eyeFrame, eyeBall, c1, c2, gradientType, bg, bgMode, outer, label, logoId)
  var T = [];
  function t(name, cat, body, ef, eb, c1, c2, gt, bg, mode, outer, label, logo) {
    T.push({
      id: T.length + 1, name: name, cat: cat, body: body, eyeFrame: ef, eyeBall: eb,
      fg: { type: c1 === c2 ? 'solid' : gt, c1: c1, c2: c2, angle: 45 },
      bg: bg, bgMode: mode, outer: outer || '#C7A9A3', label: label || '', logo: logo || ''
    });
  }
  // Minimal
  t('Plum Classic', 'Minimal', 'square', 'square', 'square', '#3E3239', '#3E3239', 'linear', '#F7EFE7', 'full');
  t('Soft Rounded', 'Minimal', 'rounded', 'rounded', 'rounded', '#3E3239', '#3E3239', 'linear', '#F7EFE7', 'full');
  t('Pure Ink', 'Minimal', 'square', 'square', 'square', '#000000', '#000000', 'linear', '#FFFFFF', 'full');
  t('Swiss Dots', 'Minimal', 'dots', 'rounded', 'circle', '#18181B', '#18181B', 'linear', '#FAFAFA', 'full');
  t('Paper Liquid', 'Minimal', 'liquid', 'rounded', 'rounded', '#2B2326', '#2B2326', 'linear', '#E8D2C4', 'full');
  t('Slate Bars', 'Minimal', 'bars', 'square', 'square', '#0F172A', '#0F172A', 'linear', '#F1F5F9', 'full');
  t('Mono Pearl', 'Minimal', 'pearl', 'circle', 'circle', '#27272A', '#27272A', 'linear', '#FFFFFF', 'full');
  t('Clean Frame', 'Minimal', 'rounded', 'rounded', 'circle', '#3E3239', '#3E3239', 'linear', '#F7EFE7', 'center', '#E8D2C4', 'SCAN ME');
  // Dark
  t('Noir Rose', 'Dark', 'liquid', 'rounded', 'circle', '#E8D2C4', '#C7A9A3', 'linear', '#2A2126', 'full');
  t('Midnight Cyan', 'Dark', 'dots', 'circle', 'circle', '#22D3EE', '#818CF8', 'linear', '#0B1020', 'full');
  t('Gold Night', 'Dark', 'classy', 'rounded', 'rounded', '#FCD34D', '#F59E0B', 'linear', '#14110A', 'center', '#3E3239', 'SCAN ME');
  t('Carbon', 'Dark', 'square', 'square', 'square', '#E5E5E5', '#E5E5E5', 'linear', '#0A0A0A', 'full');
  t('Violet Glow', 'Dark', 'rounded', 'leaf', 'circle', '#C4B5FD', '#F0ABFC', 'linear', '#150B2E', 'center', '#2E1065');
  t('Ice Blue', 'Dark', 'pearl', 'circle', 'circle', '#E0F2FE', '#7DD3FC', 'linear', '#0B1B2B', 'full');
  t('Sunset Night', 'Dark', 'liquid', 'leaf', 'rounded', '#FDBA74', '#FB7185', 'linear', '#1B0F0A', 'small', '#7C2D12');
  t('Noir Gold', 'Dark', 'diamond', 'rounded', 'rounded', '#F5D06F', '#C99A2E', 'linear', '#111111', 'center', '#000000', 'SCAN ME');
  // Neon
  t('Neon Mint', 'Neon', 'dots', 'circle', 'circle', '#34D399', '#22D3EE', 'linear', '#04130E', 'full');
  t('Hot Pink', 'Neon', 'rounded', 'rounded', 'circle', '#F472B6', '#FB7185', 'linear', '#1A0A14', 'full');
  t('Lime Volt', 'Neon', 'square', 'square', 'square', '#BEF264', '#4ADE80', 'linear', '#0A1405', 'full');
  t('Cyber Violet', 'Neon', 'diamond', 'rounded', 'diamond', '#A78BFA', '#22D3EE', 'linear', '#0A0618', 'full');
  t('Electric Lines', 'Neon', 'hbars', 'rounded', 'rounded', '#60A5FA', '#A78BFA', 'linear', '#050B1F', 'full');
  t('Laser Red', 'Neon', 'rounded', 'square', 'square', '#FB7185', '#F43F5E', 'linear', '#12060A', 'full');
  t('Aqua Pulse', 'Neon', 'liquid', 'circle', 'circle', '#67E8F9', '#34D399', 'linear', '#04141A', 'small', '#0E7490', 'SCAN ME');
  // Gradient
  t('Aurora', 'Gradient', 'dots', 'rounded', 'circle', '#0284C7', '#7C3AED', 'linear', '#FFFFFF', 'full');
  t('Fire Rise', 'Gradient', 'liquid', 'leaf', 'rounded', '#B91C1C', '#EA580C', 'linear', '#FFF7ED', 'full');
  t('Cotton Candy', 'Gradient', 'rounded', 'rounded', 'circle', '#BE185D', '#7C3AED', 'linear', '#FFF0F7', 'full');
  t('Ocean Mint', 'Gradient', 'classy', 'rounded', 'rounded', '#065F46', '#0891B2', 'linear', '#ECFEFF', 'full');
  t('Rose Radial', 'Gradient', 'dots', 'circle', 'circle', '#5B2A3A', '#A64B63', 'radial', '#FBEFEA', 'full');
  t('Grape Soda', 'Gradient', 'bars', 'rounded', 'rounded', '#581C87', '#C026D3', 'linear', '#FDF4FF', 'full');
  t('Sky Blueberry', 'Gradient', 'pearl', 'circle', 'circle', '#1E3A8A', '#6D28D9', 'linear', '#FFFFFF', 'center', '#C7D2FE', 'SCAN ME');
  t('Peach Fizz', 'Gradient', 'rounded', 'leaf', 'leaf', '#9F1239', '#EA580C', 'linear', '#FFF7ED', 'small', '#FED7AA');
  // Social
  t('WhatsApp Chat', 'Social', 'dots', 'circle', 'circle', '#14532D', '#16A34A', 'linear', '#F0FDF4', 'full', '', 'CHAT WITH ME', 'whatsapp');
  t('Facebook Page', 'Social', 'rounded', 'rounded', 'rounded', '#1E3A8A', '#1D4ED8', 'linear', '#EFF6FF', 'full', '', 'FOLLOW US', 'facebook');
  t('Insta Glow', 'Social', 'rounded', 'circle', 'circle', '#7C3AED', '#DB2777', 'linear', '#FFFFFF', 'full', '', 'FOLLOW ON INSTA', 'instagram');
  t('YouTube Red', 'Social', 'square', 'rounded', 'rounded', '#7F1D1D', '#DC2626', 'linear', '#FEF2F2', 'full', '', 'WATCH NOW', 'youtube');
  t('X Mono', 'Social', 'square', 'square', 'square', '#000000', '#000000', 'linear', '#FFFFFF', 'full', '', 'FOLLOW ON X', 'x');
  t('LinkedIn Pro', 'Social', 'rounded', 'rounded', 'rounded', '#0C4A6E', '#0369A1', 'linear', '#F0F9FF', 'full', '', 'CONNECT', 'linkedin');
  t('Telegram Sky', 'Social', 'dots', 'circle', 'circle', '#0369A1', '#0284C7', 'linear', '#F0F9FF', 'full', '', 'JOIN CHANNEL', 'telegram');
  t('Website Globe', 'Social', 'classy', 'rounded', 'rounded', '#3E3239', '#6B5560', 'linear', '#F7EFE7', 'full', '', 'VISIT WEBSITE', 'website');
  // Business
  t('Corporate Navy', 'Business', 'square', 'square', 'rounded', '#0F1B3D', '#2B4A9E', 'linear', '#EEF2FF', 'center', '#0F1B3D', 'SCAN TO CONNECT');
  t('Agency Plum', 'Business', 'liquid', 'rounded', 'circle', '#3E3239', '#8A5A6B', 'linear', '#F7EFE7', 'center', '#3E3239', 'SCAN ME');
  t('Menu Card', 'Business', 'rounded', 'rounded', 'rounded', '#7C2D12', '#7C2D12', 'linear', '#FEF6E7', 'small', '#7C2D12', 'VIEW MENU');
  t('Pay with UPI', 'Business', 'rounded', 'rounded', 'circle', '#1E1B4B', '#4F46E5', 'linear', '#EEF2FF', 'full', '', 'SCAN & PAY', 'rupee');
  t('Wi-Fi Join', 'Business', 'dots', 'circle', 'circle', '#134E4A', '#0D9488', 'linear', '#F0FDFA', 'full', '', 'JOIN WI-FI', 'wifi');
  t('Call Us', 'Business', 'classy', 'rounded', 'rounded', '#1E293B', '#2563EB', 'linear', '#F8FAFC', 'full', '', 'CALL US', 'phone');
  t('Email Us', 'Business', 'hbars', 'square', 'square', '#450A0A', '#BE123C', 'linear', '#FFF5F5', 'full', '', 'EMAIL US', 'mail');
  // Festive
  t('Diwali Glow', 'Festive', 'diamond', 'rounded', 'diamond', '#7C2D12', '#D97706', 'linear', '#FFFBEB', 'center', '#7C2D12', 'HAPPY DIWALI');
  t('Holi Splash', 'Festive', 'dots', 'circle', 'circle', '#701A75', '#DB2777', 'linear', '#FFF0F7', 'center', '#FBCFE8', 'HAPPY HOLI');
  t('Eid Mubarak', 'Festive', 'classy', 'rounded', 'circle', '#064E3B', '#059669', 'linear', '#ECFDF5', 'small', '#064E3B', 'EID MUBARAK');
  t('Christmas', 'Festive', 'rounded', 'rounded', 'circle', '#7F1D1D', '#166534', 'linear', '#FEF2F2', 'center', '#14532D', 'MERRY XMAS');
  t('New Year Gold', 'Festive', 'diamond', 'square', 'rounded', '#F5D06F', '#C99A2E', 'linear', '#0A0A0A', 'center', '#1C1917', 'HAPPY NEW YEAR');
  t('Valentine', 'Festive', 'rounded', 'rounded', 'heart', '#9F1239', '#DB2777', 'linear', '#FFF1F2', 'full', '', 'WITH LOVE', 'heart');
  t('Navratri', 'Festive', 'liquid', 'leaf', 'rounded', '#9A3412', '#BE185D', 'linear', '#FFF7ED', 'small', '#9A3412', 'SHUBH NAVRATRI');
  // Pastel
  t('Baby Pink', 'Pastel', 'rounded', 'rounded', 'circle', '#831843', '#BE185D', 'linear', '#FCE7F3', 'center', '#FBCFE8');
  t('Mint Fresh', 'Pastel', 'dots', 'circle', 'circle', '#065F46', '#0F766E', 'linear', '#D1FAE5', 'center', '#A7F3D0');
  t('Lilac Dream', 'Pastel', 'pearl', 'circle', 'circle', '#4C1D95', '#7E22CE', 'linear', '#EDE9FE', 'small', '#DDD6FE');
  t('Peach Cream', 'Pastel', 'liquid', 'rounded', 'rounded', '#9A3412', '#C2410C', 'linear', '#FFEDD5', 'center', '#FED7AA');
  t('Sky Whisper', 'Pastel', 'rounded', 'rounded', 'circle', '#0C4A6E', '#1D4ED8', 'linear', '#E0F2FE', 'small', '#BAE6FD');
  t('Butter', 'Pastel', 'classy', 'rounded', 'rounded', '#713F12', '#A16207', 'linear', '#FEF9C3', 'center', '#FDE68A');
  t('Sage', 'Pastel', 'bars', 'rounded', 'rounded', '#365314', '#3F6212', 'linear', '#ECFCCB', 'small', '#D9F99D');
  QRO.TEMPLATES = T;
  QRO.TEMPLATE_CATS = ['All', 'Minimal', 'Dark', 'Neon', 'Gradient', 'Social', 'Business', 'Festive', 'Pastel'];

  /** Convert a template record into render options (logo image must be attached by caller). */
  QRO.templateToState = function (tpl) {
    return {
      body: tpl.body, eyeFrame: tpl.eyeFrame, eyeBall: tpl.eyeBall,
      fg: Object.assign({}, tpl.fg), eyeFrameColor: '', eyeBallColor: '',
      bgMode: tpl.bgMode, bg: tpl.bg, outer: tpl.outer || '#C7A9A3',
      frameOn: !!tpl.label, frameText: tpl.label || 'SCAN ME', frameColor: tpl.fg.c1, frameTextColor: tpl.bg,
      logoId: tpl.logo || ''
    };
  };

  /* ============================== content builders ============================== */
  function enc(s) { return encodeURIComponent(s || ''); }
  function wifiEsc(s) { return String(s || '').replace(/([\\;,:"])/g, '\\$1'); }
  QRO.normalizeUrl = function (v) {
    v = (v || '').trim();
    if (!v) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
    if (/^[^\s]+\.[^\s]{2,}/.test(v) || /^localhost/i.test(v)) return 'https://' + v;
    return v;
  };
  QRO.CONTENT_TYPES = [
    { id: 'url', name: 'Website / URL', fields: [{ k: 'url', l: 'Website link', p: 'https://your-website.com', t: 'url' }] },
    { id: 'text', name: 'Plain text', fields: [{ k: 'text', l: 'Your text', p: 'Type anything…', t: 'textarea' }] },
    { id: 'whatsapp', name: 'WhatsApp', fields: [{ k: 'phone', l: 'Number with country code', p: '919876543210', t: 'tel' }, { k: 'msg', l: 'Pre-filled message (optional)', p: 'Hi! I found you via QR', t: 'text' }] },
    { id: 'wifi', name: 'Wi-Fi', fields: [{ k: 'ssid', l: 'Network name', p: 'MyWiFi', t: 'text' }, { k: 'pass', l: 'Password', p: '••••••••', t: 'text' }, { k: 'enc', l: 'Security', t: 'select', o: [['WPA', 'WPA / WPA2'], ['WEP', 'WEP'], ['nopass', 'No password']] }] },
    { id: 'upi', name: 'UPI Payment', fields: [{ k: 'pa', l: 'UPI ID', p: 'name@bank', t: 'text' }, { k: 'pn', l: 'Payee name', p: 'Your name', t: 'text' }, { k: 'am', l: 'Amount ₹ (optional)', p: '', t: 'number' }, { k: 'tn', l: 'Note (optional)', p: '', t: 'text' }] },
    { id: 'email', name: 'Email', fields: [{ k: 'to', l: 'Email address', p: 'hello@example.com', t: 'email' }, { k: 'sub', l: 'Subject (optional)', p: '', t: 'text' }, { k: 'body', l: 'Message (optional)', p: '', t: 'text' }] },
    { id: 'phone', name: 'Phone call', fields: [{ k: 'num', l: 'Phone number', p: '+919876543210', t: 'tel' }] }
  ];
  QRO.buildContent = function (type, f) {
    f = f || {};
    switch (type) {
      case 'url': return QRO.normalizeUrl(f.url);
      case 'text': return (f.text || '').trim();
      case 'whatsapp':
        var d = String(f.phone || '').replace(/\D/g, '');
        if (!d) return '';
        return 'https://wa.me/' + d + (f.msg ? '?text=' + enc(f.msg) : '');
      case 'wifi':
        if (!f.ssid) return '';
        var e = f.enc || 'WPA';
        return 'WIFI:T:' + e + ';S:' + wifiEsc(f.ssid) + ';' + (e === 'nopass' ? '' : 'P:' + wifiEsc(f.pass) + ';') + ';';
      case 'upi':
        if (!f.pa) return '';
        return 'upi://pay?pa=' + enc(f.pa) + '&pn=' + enc(f.pn) + (f.am ? '&am=' + enc(f.am) : '') + '&cu=INR' + (f.tn ? '&tn=' + enc(f.tn) : '');
      case 'email':
        if (!f.to) return '';
        var q = [];
        if (f.sub) q.push('subject=' + enc(f.sub));
        if (f.body) q.push('body=' + enc(f.body));
        return 'mailto:' + f.to.trim() + (q.length ? '?' + q.join('&') : '');
      case 'phone':
        return f.num ? 'tel:' + String(f.num).replace(/[^\d+]/g, '') : '';
    }
    return '';
  };
})(typeof window !== 'undefined' ? window : globalThis);
