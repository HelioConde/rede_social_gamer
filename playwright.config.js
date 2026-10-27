import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e',
  timeout:30000,
  retries:process.env.CI?1:0,
  workers: process.env.CI ? 2 : undefined,
  reporter:process.env.CI?'github':'list',
  use:{baseURL:'http://127.0.0.1:4173',screenshot:'only-on-failure',trace:'retain-on-failure'},
  projects:[
    {name:'mobile-320',use:{...devices['Desktop Chrome'],viewport:{width:320,height:740}}},
    {name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900}}},
    {name:'mobile',use:{...devices['Desktop Chrome'],viewport:{width:375,height:812}}},
    {name:'tablet',use:{...devices['Desktop Chrome'],viewport:{width:768,height:1024}}},
    {name:'laptop',use:{...devices['Desktop Chrome'],viewport:{width:1024,height:768}}}
  ],
  webServer:{command:'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30000,env:{VITE_APP_MODE:'demo'}}
});