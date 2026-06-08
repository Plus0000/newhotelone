import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));

// Set auth in localStorage before navigating
await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('auth-storage', JSON.stringify({ state: { isLoggedIn: true, user: 'admin' }, version: 0 }));
});

// Go to projects page
await page.goto('http://localhost:3003/projects', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// Check how many projects exist
const projectCount = await page.locator('.ant-table-tbody tr').count();
console.log('Project count:', projectCount);

if (projectCount > 0) {
  // Click 编辑 on the first project
  const editLink = page.locator('a:has-text("编辑")').first();
  await editLink.click();
  await page.waitForTimeout(2000);
} else {
  // No projects - create one first
  await page.click('button:has-text("新增项目")');
  await page.waitForTimeout(1000);
  await page.fill('input[placeholder="请输入姓名"]', '测试人');
  const sel = page.locator('.ant-select-selector').first();
  await sel.click();
  await page.waitForTimeout(300);
  await page.click('.ant-select-item-option:first-child');
  await page.waitForTimeout(200);
  await page.click('button:has-text("保存")');
  await page.waitForTimeout(1000);
}

const url = page.url();
console.log('Current URL:', url);

const pageTitle = await page.title();
console.log('Page title:', pageTitle);

// Check for key elements
const hasSteps = await page.locator('.ant-steps').first().count();
console.log('Has steps:', hasSteps > 0);

const hasCard = await page.locator('.ant-card').first().count();
console.log('Has card:', hasCard > 0);

// Check for form
const formItems = await page.locator('.ant-form-item').count();
console.log('Form items count:', formItems);

// Get visible text
const bodyText = await page.locator('body').textContent();
console.log('Body text (first 300):', bodyText?.substring(0, 300));

// Check if Outlet content is rendered
const outletArea = await page.locator('.ant-steps').first().textContent();
console.log('Steps:', outletArea);

await page.screenshot({ path: '/Users/plus0/newhotelone/edit-debug.png', fullPage: true });
console.log('Screenshot saved');

await browser.close();
