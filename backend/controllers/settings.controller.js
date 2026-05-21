const fs = require('fs').promises;
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../data/settings.json');

const getSettings = async (req, res) => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Error reading settings:', err);
    res.status(500).json({ message: 'Lỗi server khi đọc cấu hình' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ message: 'Dữ liệu cấu hình không hợp lệ' });
    }

    // Merge with existing settings to prevent dropping keys
    const currentData = await fs.readFile(SETTINGS_FILE, 'utf8');
    const currentSettings = JSON.parse(currentData);
    const newSettings = { ...currentSettings, ...settings };

    await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf8');
    
    // TODO: log audit here
    
    res.json({ message: 'Cập nhật cấu hình thành công', settings: newSettings });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ message: 'Lỗi server khi lưu cấu hình' });
  }
};

module.exports = { getSettings, updateSettings };
