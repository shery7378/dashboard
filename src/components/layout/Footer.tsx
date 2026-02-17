'use client';

import Link from 'next/link';
import { Instagram } from '@mui/icons-material';

import { getStorageUrl } from '@/utils/urlHelpers';

/**
 * Footer component matching the provided design image exactly.
 */
export default function Footer() {
  const discoverLinks = [
    { label: 'Sign up to deliver', href: '/sign-up' },
    { label: 'Add your Shop', href: '/sign-up' },
    { label: 'Promotions', href: '#' },
    { label: 'Create a Business account', href: '/sign-up' },
  ];

  const usefulLinks = [
    { label: 'Store Near me', href: '#' },
    { label: 'View all cities', href: '#' },
    { label: 'Pickup near me', href: '#' },
    { label: 'View all countries', href: '#' },
  ];

  const policyLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms & Conditions', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Refund Policy', href: '#' },
  ];

  return (
    <footer id="main-footer" className="font-sans relative z-10" style={{ backgroundColor: '#1E1E1E' }}>
      <style>{`
        #main-footer {
          color: #ffffff;
        }
        #main-footer h2, #main-footer h3 {
          color: #ffffff !important;
        }
        #main-footer * {
          color: #ffffff !important;
        }
        #main-footer p {
          color: #ffffff !important;
        }
        
        /* Force all standard links to be white and no-underline, with Manrope font style */
        #main-footer .footer-nav-link {
          color: #ffffff !important;
          text-decoration: none !important;
          transition: color 0.2s ease;
          font-family: 'Manrope', sans-serif;
          font-weight: 300;
          font-size: 15.14px;
          line-height: 17.98px;
          letter-spacing: -0.28px;
        }
        #main-footer .footer-nav-link:hover {
          color: #FF6B35 !important;
        }

        /* Specifically target the email link with same styles */
        #main-footer .email-link {
          color: #ffffff !important;
          text-decoration: none !important;
          transition: color 0.2s ease;
          font-family: 'Manrope', sans-serif;
          font-weight: 300;
          font-size: 15.14px;
          line-height: 17.98px;
          letter-spacing: -0.28px;
        }
        #main-footer .email-link:hover {
          color: #FF6B35 !important;
        }
        
        /* Social Icons */
        #main-footer .social-icon {
          color: #ffffff !important;
          border: 1px solid #ffffff !important;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none !important;
          transition: all 0.2s ease;
          background-color: transparent;
        }
        #main-footer .social-icon:hover {
          background-color: #ffffff !important;
          color: #000000 !important;
          border-color: #ffffff !important;
        }

        /* Bottom Bar */
        #main-footer .bottom-bar {
          background-color: #ffffff !important;
          border-top-left-radius: 30px;
          border-top-right-radius: 30px;
        }
        #main-footer .copyright-text {
          color: #1B1B1B !important;
          font-family: 'Manrope', sans-serif;
          font-weight: 300;
          font-size: 20px;
          line-height: 24px;
          letter-spacing: 0;
        }
        
        /* Get Started Button */
        #main-footer .get-started-btn {
          background-color: #F34222 !important;
          color: #ffffff !important;
          text-decoration: none !important;
          width: 148px;
          height: 53px;
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        #main-footer .get-started-btn:hover {
          opacity: 0.9;
        }
      `}</style>
      
      {/* Main Footer Content */}
      <div
        className="container mx-auto px-4 pt-12 md:pt-16 pb-10"
        style={{ maxWidth: '1172px' }}
      >
        <div className="flex flex-wrap lg:flex-nowrap justify-between gap-8 sm:gap-12">
          {/* Column 1 - Brand */}
          <div className="w-full sm:w-auto flex-shrink-0 sm:max-w-xs">
            <div className="mb-8 pt-8">
              <img 
                src={getStorageUrl('/storage/images/logo/MultiKonnect.png')}
                alt="MultiKonnect" 
                className="h-6 w-auto object-contain"
              />
            </div>
            <p 
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 300,
                fontSize: '15.14px',
                lineHeight: '22.71px',
                letterSpacing: '0',
                width: '234px',
                height: '59px',
                opacity: 1
              }}
            >
              Empowering your shopping experience for a smarter <br /> tomorrow !
            </p>
          </div>

          {/* Column 2 - Discover */}
          <div className="w-full sm:w-auto">
            <h3 
              className="mb-4 text-white pt-8"
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500,
                fontSize: '22.71px',
                lineHeight: '24.61px',
                letterSpacing: '-1.7px'
              }}
            >
              Discover Multikonnect
            </h3>
            <ul className="space-y-3">
              {discoverLinks.map(({ label, href }, idx) => (
                <li key={idx}>
                  <Link href={href} className="footer-nav-link text-sm font-normal">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Useful Links */}
          <div className="w-full sm:w-auto">
            <h3 
              className="mb-4 text-white pt-8"
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500,
                fontSize: '22.71px',
                lineHeight: '24.61px',
                letterSpacing: '-1.7px'
              }}
            >
              Useful links
            </h3>
            <ul className="space-y-3">
              {usefulLinks.map(({ label, href }, idx) => (
                <li key={idx}>
                  <Link href={href} className="footer-nav-link text-sm font-normal">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Policy */}
          <div className="w-full sm:w-auto">
            <h3 
              className="mb-4 text-white pt-8"
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500,
                fontSize: '22.71px',
                lineHeight: '24.61px',
                letterSpacing: '-1.7px'
              }}
            >
              Privacy Policy
            </h3>
            <ul className="space-y-3">
              {policyLinks.map(({ label, href }, idx) => (
                <li key={idx}>
                  <Link href={href} className="footer-nav-link text-sm font-normal">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5 - Social & Email */}
          <div className="w-full sm:w-auto">
            <h3 
              className="mb-4 text-white pt-8"
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontWeight: 500,
                fontSize: '22.71px',
                lineHeight: '24.61px',
                letterSpacing: '-1.7px'
              }}
            >
              Social Links
            </h3>

            <div className="flex gap-3 mb-6">
              {/* Facebook */}
              <a
                href="#"
                className="social-icon w-8 h-8 rounded-full"
              >
                 <svg viewBox="0 0 320 512" fill="currentColor" width="16" height="16">
                    <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="#"
                className="social-icon w-8 h-8 rounded-full"
              >
                  <svg viewBox="0 0 448 512" fill="currentColor" width="16" height="16">
                     <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
                  </svg>
              </a>
              {/* Instagram */}
              <a
                href="#"
                className="social-icon w-8 h-8 rounded-full"
              >
                <Instagram className="text-base" />
              </a>
            </div>

            <div className="space-y-1">
              <p 
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 300,
                  fontSize: '15.14px',
                  lineHeight: '17.98px',
                  letterSpacing: '-0.28px'
                }}
              >
                Email
              </p>
              <a
                href="mailto:info@multikonnect.com"
                className="email-link text-sm"
                style={{ wordBreak: 'break-all' }}
              >
                info@multikonnect.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bottom-bar py-4 sm:py-4 relative z-20">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="copyright-text text-sm font-medium text-center sm:text-left">
            &copy; MultiKonnect 2025 | All rights reserved.
          </p>
          <Link
            href="/sign-up"
            className="get-started-btn text-sm font-normal transition-colors"
          >
            Get Started
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </div>


    </footer>
  );
}
