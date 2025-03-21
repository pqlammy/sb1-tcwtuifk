# Genner Gibelguuger Web Application

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment Guide

### 1. Prerequisites

- A Supabase account and project
- A Netlify account
- Git installed on your machine

### 2. Supabase Setup

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)

2. Get your project configuration:
   - Go to Project Settings > API
   - Copy the `Project URL` and `anon` public key
   - Create a `.env` file in your project root with:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run the database migrations:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and run all migration files from `supabase/migrations` in order

4. Configure authentication:
   - Go to Authentication > Settings
   - Enable Email provider
   - Disable "Confirm email" if not needed
   - Add your production domain to "Site URL" and "Additional redirect URLs"

### 3. Netlify Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Connect to Netlify:
   - Go to [https://app.netlify.com](https://app.netlify.com)
   - Click "New site from Git"
   - Choose your repository
   - Select the branch to deploy (usually `main` or `master`)

3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

4. Add environment variables:
   - Go to Site settings > Build & deploy > Environment
   - Add the following variables:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

5. Deploy:
   - Netlify will automatically build and deploy your site
   - Future pushes to your Git repository will trigger automatic deployments

### 4. Domain Setup (Optional)

1. Custom domain:
   - Go to Domain settings in Netlify
   - Click "Add custom domain"
   - Follow the instructions to configure your DNS

2. SSL/HTTPS:
   - Netlify automatically provisions SSL certificates
   - Enable "Force HTTPS" in your site settings

### 5. Post-Deployment

1. Update Supabase settings:
   - Add your production URL to the allowed domains in Supabase
   - Update authentication redirect URLs if using custom domain

2. Test the production site:
   - Verify authentication works
   - Check all features function correctly
   - Test on different devices and browsers

### 6. Maintenance

1. Regular updates:
   - Keep dependencies updated with `npm update`
   - Monitor Supabase dashboard for usage
   - Check Netlify analytics and logs

2. Backup:
   - Regularly backup your Supabase database
   - Keep your Git repository up to date

3. Monitoring:
   - Set up Netlify notifications for deploy status
   - Monitor Supabase logs for errors
   - Set up uptime monitoring (e.g., UptimeRobot)

## Security Considerations

1. Environment Variables:
   - Never commit `.env` files to Git
   - Use Netlify environment variables for production
   - Rotate keys periodically

2. Authentication:
   - Use strong password policies
   - Implement rate limiting
   - Monitor failed login attempts

3. Database:
   - Regularly review RLS policies
   - Monitor database access patterns
   - Keep backups secure

## Troubleshooting

### Common Issues

1. Build failures:
   - Check build logs in Netlify
   - Verify all dependencies are installed
   - Check environment variables are set

2. Authentication issues:
   - Verify Supabase URL and key
   - Check allowed domains in Supabase
   - Clear browser cache and cookies

3. Database issues:
   - Check RLS policies
   - Verify database connections
   - Monitor Supabase logs

### Support

For issues with:
- Deployment: Check [Netlify Support](https://www.netlify.com/support/)
- Database: Visit [Supabase Support](https://supabase.com/support)
- Application: Create an issue in your Git repository

## License

This project is licensed under the MIT License - see the LICENSE file for details.