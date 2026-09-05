# TaskTrace — Chiến lược đọc đủ artifact v0.2

## Kích thước và chunk

Mỗi artifact ≤4 KiB; source+A+B ≤8 KiB tổng. Đây là giới hạn thiết kế cần đo phí ở G1, không phải giới hạn chính thức của GenVM.

Chỉ nhận UTF-8 hợp lệ. Hash toàn bytes nguyên bản lưu trong contract. Không trim, đổi newline hoặc cắt nội dung sau hashing. Nếu cấm BOM/format nào thì từ chối trước lúc nộp.

Chunk bằng thuật toán deterministic: thêm từng Unicode codepoint UTF-8 tới khi thêm tiếp sẽ vượt 2048 bytes, chốt chunk và tiếp tục. Không chẻ codepoint. Mỗi chunk có index liên tục, start/end byte offset, length và SHA-256. Ghép chunks khôi phục đúng toàn bytes. Không dùng text[:N] làm căn cứ review.

## Pipeline thực thi

1. Mỗi node tải job/rubric/source/A/B từ snapshot có thẩm quyền của contract khi thực thi transaction.
2. Deterministic path kiểm tra role, issuer, revision, dependency, byte length và whole-artifact hashes.
3. Tạo đủ ordered chunks; chuyển bản dữ liệu bất biến bằng closure/input sang nondeterministic reviewer. Không ghi state trong callbacks.
4. Leader đưa toàn bộ chunks cùng nghĩa vụ và dependency cho LLM. Với tổng dữ liệu nhỏ có thể synthesis trong một lượt; nếu chia lượt phải đủ mọi chunk trước tổng hợp.
5. Response phải chứa exact obligation ID set, reviewed chunk sequence/count và citations.
6. Code validate fields, bounds, citation ranges, hashes, duplicate/missing IDs. Lời khai LLM “đã đọc đủ” không thay bước này.
7. Validator dùng snapshot của chính execution, tự hash/chunk và tự đánh giá cùng evidence; đối chiếu material decisions và hỗ trợ của citations.
8. Chỉ sau kết quả đồng thuận mới cập nhật ledger/state theo quy tắc tiền đã thống nhất.

MVP không tải artifact từ web. Nếu thêm URL provider về sau, tất cả nodes phải độc lập refetch/verify provider origin, identity, immutable version và toàn bytes trước pipeline; không tin cache frontend.

## Không ép kết luận

- Hash/length/domain mismatch: deterministic failure.
- Thiếu tài liệu cần thiết hoặc nghĩa vụ mơ hồ: UNASSESSABLE.
- LLM corrupt output: reject attempt/rotate theo flow đã test.
- RPC/network/LLM unavailable: controlled error/retry; không biến thành bên A/B có lỗi.
- Không để UI tuyên bố “đã xác minh web source” vì bản đầu không có chức năng đó.

## Điều kiện nghiệm thu

- Đổi byte cuối, ID của job/stage/issuer/revision: bị chặn.
- Ngoại lệ ở chunk cuối hoặc mâu thuẫn qua hai chunks: được xét đủ.
- Thiếu/trùng/đảo chunks, missing/duplicate obligation: bị chặn.
- Leader đề xuất material result sai nhưng đúng schema: validator phải từ chối.
- Ghi latency/fee/storage cost thực. Nếu cần giảm size thì giảm giới hạn nhận trước, không cắt ngầm.

Việc model nhận đủ bytes không bảo đảm hiểu đúng. Kết quả các test semantic đối kháng là bằng chứng bổ sung cần công bố.
