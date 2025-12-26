"use client";

import { Input, Tag } from "@lobehub/ui";
import { Text } from "@lobehub/ui";
import { AuroraBackground } from "@lobehub/ui/awesome";
import { createStyles } from "antd-style";
import { Search } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectCoverflow,
} from "swiper/modules";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
const useStyles = createStyles(({ css, token, responsive }) => ({
  wrapper: css`
    display: flex;
    padding: 24px 16px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: ${token.colorBgLayout};
    border-top: 1px solid ${token.colorBorder};

    @media (max-width: 1250px) {
      padding: 60px 20px;
    }
  `,

  container: css`
    flex-flow: row;
    flex: none;
    place-content: center flex-start;
    align-items: center;
    gap: 32px;
    width: 100%;
    max-width: 1200px;
    height: min-content;
    padding: 0;
    display: flex;
    position: relative;
    overflow: visible;
  `,

  left: css`
    flex-flow: column;
    flex: 1 0 0;
    place-content: flex-start center;
    align-items: flex-start;
    gap: 24px;
    width: 1px;
    max-width: 600px;
    height: min-content;
    padding: 0;
    display: flex;
    position: relative;
    overflow: hidden;
    @media (max-width: 1250px) {
      align-items: flex-start;
      text-align: left;
    }
  `,

  tag: css`
    display: inline-flex;
    flex-flow: row;
    align-items: center;
    gap: 8px;
    border: 1px solid ${token.colorBorder};
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 12px; /* 100% */
    letter-spacing: 2.4px;
    text-transform: uppercase;
    width: fit-content;

    &::before {
      left: 0.5px;
      width: 16px;
      height: 16px;
      background-image: url("/access/zama.png");
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
  `,

  searchWrapper: css`
    display: flex;
    position: relative;
    width: 100%;
    max-width: 600px;
    height: min-content;
    overflow: visible;
  `,

  searchIcon: css`
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
    z-index: 10;
  `,

  searchInput: css`
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px 20px 12px 50px;
    color: white;
    height: 56px;
    font-size: 14px;

    &::placeholder {
      color: #666;
    }

    &:focus {
      outline: none;
    }
  `,

  tags: css`
    display: flex;
    flex-flow: row wrap;
    place-content: flex-start;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: min-content;
    position: relative;
    overflow: visible;

    @media (max-width: 1250px) {
      place-content: center;
    }
  `,

  filterTag: css`
    border: 1px solid ${token.colorBorder};
    color: ${token.colorText};
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-family: Onest;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;

    &:hover {
      border-color: ${token.colorBorder};
      color: ${token.colorText};
    }

    &.active {
      background: ${token.colorBorder};
      color: ${token.colorText};
      border-color: ${token.colorBorder};
    }
  `,

  swiperWrapper: css`
    display: flex;
    flex-flow: column;
    align-items: center;
    gap: 10px;
    flex-direction: column;
    flex: 1 0 0;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;

    @media (max-width: 1250px) {
      width: 100%;
    }

    .swiper {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .swiper-slide {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    /* Card ở giữa (active) */
    .swiper-slide-active {
      opacity: 1;
      transform: scale(1.05);
      z-index: 10;
    }

    .swiper-slide-prev,
    .swiper-slide-next {
      opacity: 0.5;
      filter: blur(2px);
      transform: scale(0.9);
    }

    .swiper-slide:not(.swiper-slide-active):not(.swiper-slide-prev):not(
        .swiper-slide-next
      ) {
      opacity: 0.3;
      filter: blur(3px);
      transform: scale(0.85);
    }
  `,

  card: css`
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    transition: all 0.3s;

    &:hover {
      border-color: ${token.colorBorder};
    }
  `,

  cardImage: css`
    background: ${token.colorBgElevated};
    display: flex;
    place-content: center;
    align-items: center;
    overflow: hidden;
    position: relative;
    display: flex;
    padding: 8px;
    justify-content: flex-end;
    align-items: flex-start;
    border-radius: 16px;
    opacity: 1;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }
  `,
}));

export default function HeroSection() {
  const { styles, cx } = useStyles();
  const cards = [
    { title: "Alligator", 
      image: "/access/tiger.png" },
    {
      title: "Pink Panther",
      image: "/access/stutu.png",
    },
    { title: "Code Red", 
      image: "/access/red.png" },
    {
      title: "All Fubbles",
      image: "/access/monkey.png",
    },
    {
      title: "Green Monster",
      image: "/access/ailen.png",
    },
  ];

  return (
    <div className={styles.wrapper}>
      <AuroraBackground />
      <div className={styles.container}>
        {/* LEFT SECTION */}
        <div className={styles.left}>
          <div className={styles.tag}>FHE Template</div>
          <Text
            as="h1"
            strong
            style={{
              fontFamily: "Onest",
              fontSize: 60,
              fontStyle: "normal",
              fontWeight: 600,
              lineHeight: "60px",
              letterSpacing: "-2.4px",
              whiteSpace: "nowrap",
              margin: 0,
            }}
          >
            Meet the new home <br />
            for your digital goods
          </Text>
          <Text
            as="h2"
            strong
            style={{
              color: "#666",
              fontFamily: "Onest",
              fontSize: 28,
              fontStyle: "normal",
              fontWeight: 500,
              lineHeight: "39.2px",
              margin: 0,
            }}
          >
            Sell exclusive access to your digital goods
            <br />
            all in your Framer CMS site
          </Text>

          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <Input
              type="text"
              placeholder="Search 3D assets..."
              className={styles.searchInput}
            />
          </div>

          <div className={styles.tags}>
            <span className={cx(styles.filterTag, "active")}>All</span>
            <span className={styles.filterTag}>Free</span>
            <span className={styles.filterTag}>Aliens</span>
            <span className={styles.filterTag}>Animals</span>
            <span className={styles.filterTag}>Monsters</span>
          </div>
        </div>

        {/* RIGHT SECTION - Swiper Carousel */}
        <div className={styles.swiperWrapper}>
          <Swiper
            modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
            effect="coverflow"
            centeredSlides
            slidesPerView="auto"
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            loop
            speed={800}
            allowTouchMove={false}
            grabCursor={false}
          >
            {cards.map((card, index) => (
              <SwiperSlide key={index} style={{ width: "375px" }}>
                <div className={styles.card}>
                  <div className={styles.cardImage}>
                    <img src={card.image} />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
}
