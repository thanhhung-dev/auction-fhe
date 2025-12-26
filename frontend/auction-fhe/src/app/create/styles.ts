import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css, responsive }) => ({
  // Container chính
  container: css`
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px;

    ${responsive.sm} {
      padding: 20px 16px;
    }
  `,

  // Tiêu đề trang
  headerSection: css`
    text-align: center;
    margin-bottom: 40px;
  `,

  title: css`
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(
      135deg,
      ${token.colorPrimary},
      ${token.colorInfo}
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `,

  subtitle: css`
    font-size: 16px;
    color: ${token.colorTextSecondary};
  `,

  // Card chứa Form
  formCard: css`
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    border-radius: 16px;
    border: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
    overflow: hidden;

    .ant-card-head {
      border-bottom: 1px solid ${token.colorBorderSecondary};
      background: ${token.colorFillQuaternary};
    }
  `,

  // Khu vực Preview (Sticky)
  previewWrapper: css`
    position: sticky;
    top: 24px;

    ${responsive.md} {
      position: static;
      margin-top: 32px;
    }
  `,

  previewTitle: css`
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  `,

  // Khung ảnh Preview
  imageContainer: css`
    width: 100%;
    aspect-ratio: 1/1;
    background: ${token.colorFillAlter};
    border-radius: 12px;
    border: 2px dashed ${token.colorBorder};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    transition: all 0.3s ease;

    &:hover {
      border-color: ${token.colorPrimary};
    }
  `,

  // Placeholder khi chưa có ảnh
  emptyState: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    color: ${token.colorTextQuaternary};
    margin: 121px;

    .icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
  `,

  // Nút Submit
  submitButton: css`
    height: 50px;
    font-size: 16px;
    font-weight: 600;
    margin-top: 24px;
    box-shadow: 0 4px 14px ${token.colorPrimaryActive};

    &:hover {
      transform: translateY(-1px);
    }
  `,

  // Hướng dẫn phụ
  helperCard: css`
    margin-top: 24px;
    background: ${token.colorInfoBg};
    border: 1px solid ${token.colorInfoBorder};
    border-radius: 12px;

    ul {
      padding-left: 20px;
      margin: 0;
      color: ${token.colorTextSecondary};

      li {
        margin-bottom: 6px;
      }
    }
  `,
}));
