'use client';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';
import { FacebookFilled, LinkedinFilled, InstagramFilled, XOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useStyles } from './style';
import type { FooterProps } from './type';
// import Logo from '@/components/brand/LogoRecruitify/Logo';

const Footer = memo<FooterProps>(
  ({ columns, bottom,  contentMaxWidth = 1450, children, ...rest }) => {
    const isEmpty = ! columns || columns?. length === 0;
    const { styles } = useStyles({ contentMaxWidth, isEmpty });

    return (
      <Flexbox as={'section'} className={styles.root} width={'100%'} {...rest}>
        <div className={styles.footer}>
          <div className={styles.footerContainer}>
            {/* Footer Top - Columns */}
            {! isEmpty && (
              <div className={styles.footerColumns}>
                {columns?.map((column, index) => (
                  <div key={index} className={styles.footerColumn}>
                    <h2>{column.title}</h2>
                    {column.items?.map((item, itemIndex) => (
                      <div key={itemIndex} className={styles.footerItem}>
                        {item.url ? (
                          <Link 
                            href={item.url}
                            target={item.openExternal ? '_blank' : undefined}
                            rel={item.openExternal ? 'noopener noreferrer' : undefined}
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span>{item.title}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Social Icons Column */}
                <div className={styles.footerColumn}>
                  <h2>Stay connected</h2>
                  <div className={styles.socialIcons}>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <FacebookFilled />
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <LinkedinFilled />
                    </a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <InstagramFilled />
                    </a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
                      <XOutlined />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Bottom */}
            <div className={styles. footerBottom}>
              <div className={styles.brandSection}>
                <div className={styles.brandLogo}>
                  <div>
                    {/* <Logo></Logo> */}
                  </div>
                </div>
                <p className={styles.brandDescription}>
                  AuctionFHE is designed to revolutionize how businesses operate. 
                </p>
              </div>

              {bottom && (
                <div className={styles.copyright}>
                  {bottom}
                </div>
              )}
            </div>
          </div>
        </div>
        {children}
      </Flexbox>
    );
  },
);

Footer.displayName = 'Footer';

export default Footer;