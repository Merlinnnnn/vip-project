import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";
import PageTitle from "../../components/ui/PageTitle";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileQuestion className="h-24 w-24 text-slate-300 dark:text-slate-600 mb-6" />
      <PageTitle title="404 - Không tìm thấy trang" subtitle="Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển." />
      <div className="mt-8">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          Trở về Trang chủ
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
