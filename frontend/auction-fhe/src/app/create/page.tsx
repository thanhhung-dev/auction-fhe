"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { parseEventLogs } from "viem";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  Row,
  Col,
  message,
  Image,
  Typography,
  Tag,
} from "antd";
import {
  RocketOutlined,
  EyeOutlined,
  FileImageOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

// Hooks & Utils
import { useAuction } from "@/hooks/useAuction";
import { saveAuctionMetadata } from "@/lib/auctionMetadata";
import AuctionABI from "@/lib/contracts/SimpleFHEAuction.json"; // Dòng bị lỗi
import { useStyles } from "./styles"; // Import style từ file trên

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

export default function CreateAuctionPage() {
  const { styles, theme } = useStyles(); // Sử dụng styles
  const { address, isConnected } = useAccount();
  const { createAuction } = useAuction();
  const router = useRouter();
  const [form] = Form.useForm();

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState({
    image: "",
    title: "",
    author: "Product Hub",
    startingBid: 0,
    software: "Blender",
  });

  // --- Logic 1: Cập nhật Live Preview ---
  const handleValuesChange = (changedValues: any, allValues: any) => {
    setPreviewData((prev) => ({
      ...prev,
      ...changedValues,
      // Fallback giá trị nếu user xóa input
      title: allValues.title || "",
      image: allValues.image || "",
      startingBid: allValues.startingBid || 0,
      software: allValues.software || "Blender",
    }));
  };

  // --- Logic 2: Xử lý Submit ---
  const onFinish = async (values: any) => {
    if (!isConnected || !address) {
      message.error("Please connect your wallet first!");
      return;
    }

    setIsSubmitting(true);
    const loadingMsg = message.loading("Creating auction on blockchain...", 0);

    try {
      // B1: Gửi transaction lên Blockchain
      const { receipt } = await createAuction(
        values.startingBid.toString(),
        values.duration
      );

      loadingMsg(); // Tắt loading cũ
      message.loading("Indexing metadata...", 0); // Hiện loading mới

      // B2: Lấy ID đấu giá từ Event Logs
      const logs = parseEventLogs({
        abi: AuctionABI.abi,
        eventName: "AuctionCreated", // Tên event trong Smart Contract
        logs: receipt.logs,
      });

      if (logs.length === 0) {
        throw new Error("Could not find AuctionCreated event in logs");
      }

      // Giả sử event trả về: auctionId
      const auctionId = Number(logs[0].args.auctionId);
      const tokenId = logs[0].args.tokenId?.toString() || auctionId.toString();

      // B3: Lưu Metadata vào LocalStorage (Mock Backend)
      saveAuctionMetadata(auctionId, {
        title: values.title,
        author: values.author || "Anonymous",
        image: values.image,
        thumbnails: [values.image, values.image, values.image, values.image], // Demo thumbnails
        description: values.description,
        software: values.software,
        seller: address,
        startingBid: values.startingBid.toString(),
        contractAddress: receipt.to || "",
        auctionStartTime: Math.floor(Date.now() / 1000),
        auctionEndTime: Math.floor(Date.now() / 1000) + values.duration,
        tokenId: tokenId,
      });

      message.destroy();
      message.success(`Auction #${auctionId} created successfully!`);

      // B4: Chuyển hướng
      router.push(`/auctions/${auctionId}`);
    } catch (error: any) {
      message.destroy();
      console.error(error);
      message.error(error.message || "Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI Render ---
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerSection}>
        <div className={styles.title}>Create New Auction</div>
        <div className={styles.subtitle}>
          Mint your digital asset and start an encrypted FHE auction instantly.
        </div>
      </div>

      <Row gutter={[40, 40]}>
        {/* === CỘT TRÁI: FORM NHẬP LIỆU === */}
        <Col xs={24} lg={15}>
          <Card
            title="Item Details"
            className={styles.formCard}
            variant="borderless"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onValuesChange={handleValuesChange}
              initialValues={{
                duration: 86400,
                software: "Blender",
                author: "Product Hub",
                startingBid: 0.01,
              }}
              requiredMark="optional"
            >
              <Form.Item
                label="Item Name"
                name="title"
                rules={[{ required: true, message: "Please enter a name" }]}
              >
                <Input size="large" placeholder="e.g. Mystic Dragon #01" />
              </Form.Item>

              <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: "Tell us about your item" }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Provide a detailed description of your item..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                label="Image URL"
                name="image"
                tooltip="Direct link to image (png, jpg, gif)"
                rules={[
                  { required: true, message: "Image URL is required" },
                  { type: "url", message: "Must be a valid URL" },
                ]}
              >
                <Input
                  prefix={<FileImageOutlined />}
                  placeholder="https://..."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Starting Bid"
                    name="startingBid"
                    rules={[
                      { required: true, message: "Set a starting price" },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      size="large"
                      min={0}
                      step={0.001}
                      prefix={<DollarOutlined />}
                      suffix="ETH"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Software Used" name="software">
                    <Select size="large">
                      <Option value="Blender">Blender</Option>
                      <Option value="Maya">Maya</Option>
                      <Option value="Cinema 4D">Cinema 4D</Option>
                      <Option value="ZBrush">ZBrush</Option>
                      <Option value="Houdini">Houdini</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Duration" name="duration">
                <Select size="large" suffixIcon={<ClockCircleOutlined />}>
                  <Option value={300}>5 Minutes (Demo)</Option>
                  <Option value={3600}>1 Hour</Option>
                  <Option value={86400}>24 Hours</Option>
                  <Option value={259200}>3 Days</Option>
                  <Option value={604800}>7 Days</Option>
                </Select>
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                block
                className={styles.submitButton}
                icon={<RocketOutlined />}
              >
                {isSubmitting ? "Processing Transaction..." : "Create Auction"}
              </Button>
            </Form>
          </Card>
        </Col>

        {/* === CỘT PHẢI: PREVIEW === */}
        <Col xs={24} lg={9}>
          <div className={styles.previewWrapper}>
            <div className={styles.previewTitle}>
              <EyeOutlined /> Live Preview
            </div>

            <Card
              hoverable
              cover={
                <div className={styles.imageContainer}>
                  {previewData.image ? (
                    <Image
                      src={previewData.image}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      preview={{ mask: <EyeOutlined /> }}
                      fallback="https://placehold.co/400?text=Error"
                    />
                  ) : (
                    <div className={styles.emptyState}>
                      <FileImageOutlined className="icon" />
                      <Text type="secondary">Image will appear here</Text>
                    </div>
                  )}

                  {/* Overlay Tag */}
                  {previewData.software && (
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                      <Tag color="cyan">{previewData.software}</Tag>
                    </div>
                  )}
                </div>
              }
              actions={[
                <div key="bid" style={{ textAlign: "center" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Current Bid
                  </Text>
                  <br />
                  <Text strong>{previewData.startingBid} ETH</Text>
                </div>,
                <div key="time" style={{ textAlign: "center" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Ends In
                  </Text>
                  <br />
                  <Text strong>24h 00m</Text>
                </div>,
              ]}
            >
              <Card.Meta
                title={
                  previewData.title || (
                    <Text type="secondary" italic>
                      Untitled Item
                    </Text>
                  )
                }
                description={
                  <div>
                    <Text type="secondary">Created by </Text>
                    <Text strong>{previewData.author}</Text>
                  </div>
                }
              />
            </Card>

            {/* Instruction Box */}
            <div className={styles.helperCard}>
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  <InfoCircleOutlined
                    style={{ marginRight: 8, color: theme.colorPrimary }}
                  />
                  Important Notes
                </div>
                <ul>
                  <li>Gas fees are required to create the contract.</li>
                  <li>Once created, the auction starts immediately.</li>
                  <li>Bids are encrypted using FHE technology.</li>
                </ul>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
