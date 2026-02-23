const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

exports.handler = async (event, context) => {
    const { url } = event.queryStringParameters || {};

    if (!url) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'URL is required' }),
        };
    }

    let browser = null;

    try {
        console.log('Fetching chromium executable path...');
        const executablePath = await chromium.executablePath();
        console.log('Executable path:', executablePath);

        console.log('Launching browser...');
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: executablePath,
            headless: chromium.headless,
        });
        console.log('Browser launched successfully');

        const page = await browser.newPage();

        // Set viewport for better PDF quality on typical screens
        await page.setViewport({ width: 1200, height: 800 });

        await page.goto(url, { waitUntil: 'networkidle0' });

        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px',
            },
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="print-${Date.now()}.pdf"`,
            },
            body: pdf.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error('Error generating PDF:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate PDF', details: error.message }),
        };
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};
